package com.subsflow.common.filter;

import com.subsflow.common.context.TenantContext;
import com.subsflow.common.security.JwtService;
import com.subsflow.common.security.RateLimiterService;
import com.subsflow.product.entity.ProductCredential;
import com.subsflow.product.service.ProductCredentialService;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import com.subsflow.tenant.repository.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class TenantAuthFilter extends OncePerRequestFilter {

    private final TenantRepository tenantRepository;
    private final JwtService jwtService;
    private final RateLimiterService rateLimiterService;
    private final ProductCredentialService productCredentialService;

    public TenantAuthFilter(TenantRepository tenantRepository,
                            JwtService jwtService,
                            RateLimiterService rateLimiterService,
                            ProductCredentialService productCredentialService) {
        this.tenantRepository = tenantRepository;
        this.jwtService = jwtService;
        this.rateLimiterService = rateLimiterService;
        this.productCredentialService = productCredentialService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Bypass check for public paths and static assets
        if (isPublicPath(path, request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // 1. Handle Admin API authorization
        if (path.startsWith("/api/admin/")) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                writeErrorResponse(response, HttpStatus.UNAUTHORIZED, "Missing Authorization Bearer token");
                return;
            }
            String jwt = authHeader.substring(7).trim();
            if (!jwtService.isTokenValid(jwt)) {
                writeErrorResponse(response, HttpStatus.UNAUTHORIZED, "Invalid or expired JWT token");
                return;
            }
            String role = jwtService.extractRole(jwt);
            if (role == null || (!role.equals("ROLE_SUBSFLOW_ADMIN") && !role.startsWith("PLATFORM_") && !role.startsWith("ROLE_SUBSFLOW_"))) {
                writeErrorResponse(response, HttpStatus.FORBIDDEN, "Access denied. Admin privileges required.");
                return;
            }

            String adminEmail = jwtService.extractAdminEmail(jwt);
            String adminId = jwtService.extractTenantId(jwt);
            request.setAttribute("adminEmail", adminEmail);
            request.setAttribute("adminId", adminId);
            request.setAttribute("adminRole", role);

            filterChain.doFilter(request, response);
            return;
        }

        Tenant authenticatedTenant = null;

        // 2. Try Product Credentials Authentication (X-Client-Id & X-Client-Secret)
        String clientId = request.getHeader("X-Client-Id");
        String clientSecret = request.getHeader("X-Client-Secret");
        if (clientId != null && clientSecret != null && !clientId.trim().isEmpty() && !clientSecret.trim().isEmpty()) {
            Optional<ProductCredential> credOpt = productCredentialService.verifyAndAuthenticate(clientId.trim(), clientSecret.trim());
            if (credOpt.isPresent()) {
                ProductCredential cred = credOpt.get();
                authenticatedTenant = cred.getTenant();
                request.setAttribute("productId", cred.getProduct().getId());
                request.setAttribute("clientId", cred.getClientId());
                request.setAttribute("authMechanism", "PRODUCT_CREDENTIALS");
            } else {
                writeErrorResponse(response, HttpStatus.UNAUTHORIZED, "Invalid or revoked Product Client ID / Client Secret");
                return;
            }
        }

        // 3. Try JWT Bearer Authentication (for non-admin tenant user APIs)
        if (authenticatedTenant == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String jwt = authHeader.substring(7).trim();
                if (jwtService.isTokenValid(jwt)) {
                    // Ensure this is not an admin token trying to access tenant endpoints
                    String role = jwtService.extractRole(jwt);
                    if ("ROLE_SUBSFLOW_ADMIN".equals(role)) {
                        writeErrorResponse(response, HttpStatus.FORBIDDEN, "Admins cannot access tenant-scoped resources directly");
                        return;
                    }

                    String tenantId = jwtService.extractTenantId(jwt);
                    if (tenantId != null) {
                        authenticatedTenant = tenantRepository.findById(tenantId).orElse(null);
                        if (authenticatedTenant == null) {
                            writeErrorResponse(response, HttpStatus.UNAUTHORIZED, "Tenant associated with JWT token no longer exists");
                            return;
                        }

                        // Extract tenant user details if present in claims
                        String userId = jwtService.extractUserId(jwt);
                        if (userId != null) {
                            request.setAttribute("userId", userId);
                            request.setAttribute("role", role != null ? role.replace("ROLE_TENANT_", "") : null);
                            request.setAttribute("email", jwtService.extractEmail(jwt));
                            request.setAttribute("name", jwtService.extractName(jwt));
                            request.setAttribute("authMechanism", "TENANT_USER_JWT");
                        }
                    }
                } else {
                    writeErrorResponse(response, HttpStatus.UNAUTHORIZED, "Invalid or expired JWT token");
                    return;
                }
            }
        }

        // 4. Fallback to Legacy X-API-Key Authentication
        if (authenticatedTenant == null) {
            String apiKey = request.getHeader("X-API-Key");
            if (apiKey != null && !apiKey.trim().isEmpty()) {
                Optional<Tenant> tenantOpt = tenantRepository.findByApiKey(apiKey.trim());
                if (tenantOpt.isPresent()) {
                    authenticatedTenant = tenantOpt.get();
                    request.setAttribute("authMechanism", "TENANT_API_KEY");
                } else {
                    writeErrorResponse(response, HttpStatus.UNAUTHORIZED, "Invalid X-API-Key");
                    return;
                }
            }
        }

        // 5. If neither authentication mechanism succeeded
        if (authenticatedTenant == null) {
            writeErrorResponse(response, HttpStatus.UNAUTHORIZED, "Missing authentication credentials (JWT Bearer token, X-Client-Id/X-Client-Secret, or X-API-Key)");
            return;
        }

        // 6. Verify account status
        if (authenticatedTenant.getStatus() == TenantStatus.SUSPENDED) {
            writeErrorResponse(response, HttpStatus.FORBIDDEN, "Tenant account is suspended");
            return;
        }

        // 7. Distributed Redis Rate Limiting (Shed load before executing expensive queries)
        if (!rateLimiterService.isAllowed(authenticatedTenant.getId())) {
            writeErrorResponse(response, HttpStatus.TOO_MANY_REQUESTS, "Tenant rate limit quota exceeded. Try again in a few moments.");
            return;
        }

        try {
            TenantContext.setTenantId(authenticatedTenant.getId());
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private boolean isPublicPath(String path, String method) {
        // Allow all frontend static assets (SPA UI at root, /assets/*, /index.html, /favicon.ico)
        if (!path.startsWith("/api/")) {
            return true;
        }

        // Public admin login route
        if ("/api/admin/login".equals(path) && ("POST".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method))) {
            return true;
        }

        // Public tenant onboarding and login routes
        if (("/api/v1/tenants".equals(path) || "/api/v1/tenants/login".equals(path)) && ("POST".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method))) {
            return true;
        }
        // Public tenant user registration and login routes
        if (("/api/v1/tenant-auth/register".equals(path) || "/api/v1/tenant-auth/login".equals(path)) && ("POST".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method))) {
            return true;
        }
        // Public customer-facing product plans catalog
        if (path.startsWith("/api/v1/public/")) {
            return true;
        }
        // Public payment provider webhook endpoints
        if (path.startsWith("/api/v1/webhooks/")) {
            return true;
        }
        // Actuator endpoints are public (health, prometheus, etc.)
        if (path.startsWith("/actuator")) {
            return true;
        }
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }
        // For swagger / OpenAPI if needed
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs")) {
            return true;
        }
        return false;
    }

    private void writeErrorResponse(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String json = String.format("{\"error\": \"%s\", \"status\": %d}", message, status.value());
        response.getWriter().write(json);
    }
}

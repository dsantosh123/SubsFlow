package com.subsflow.common.filter;

import com.subsflow.common.context.TenantContext;
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

    public TenantAuthFilter(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Bypass check for public paths
        if (isPublicPath(path, request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String apiKey = request.getHeader("X-API-Key");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            writeErrorResponse(response, HttpStatus.UNAUTHORIZED, "Missing X-API-Key header");
            return;
        }

        Optional<Tenant> tenantOpt = tenantRepository.findByApiKey(apiKey);
        if (tenantOpt.isEmpty()) {
            writeErrorResponse(response, HttpStatus.UNAUTHORIZED, "Invalid X-API-Key");
            return;
        }

        Tenant tenant = tenantOpt.get();
        if (tenant.getStatus() == TenantStatus.SUSPENDED) {
            writeErrorResponse(response, HttpStatus.FORBIDDEN, "Tenant account is suspended");
            return;
        }

        try {
            TenantContext.setTenantId(tenant.getId());
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private boolean isPublicPath(String path, String method) {
        // Tenants onboarding (POST) is public
        if ("/api/v1/tenants".equals(path) && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        // Actuator endpoints are public (health, prometheus, etc.)
        if (path.startsWith("/actuator")) {
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

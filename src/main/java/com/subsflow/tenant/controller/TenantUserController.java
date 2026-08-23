package com.subsflow.tenant.controller;

import com.subsflow.common.context.TenantContext;
import com.subsflow.common.security.JwtService;
import com.subsflow.tenant.entity.TenantUser;
import com.subsflow.tenant.entity.TenantRole;
import com.subsflow.tenant.service.TenantAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/tenant-auth")
public class TenantUserController {

    private final TenantAuthService tenantAuthService;
    private final JwtService jwtService;

    public TenantUserController(TenantAuthService tenantAuthService, JwtService jwtService) {
        this.tenantAuthService = tenantAuthService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerTenant(@RequestBody RegisterRequest request) {
        try {
            TenantUser owner = tenantAuthService.registerTenant(
                    request.getCompanyName(),
                    request.getOwnerName(),
                    request.getOwnerEmail(),
                    request.getPassword()
            );

            String token = jwtService.generateTenantUserToken(owner);

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "tokenType", "Bearer",
                    "expiresInMs", jwtService.getJwtExpirationMs(),
                    "id", owner.getId(),
                    "name", owner.getName(),
                    "email", owner.getEmail(),
                    "role", owner.getRole().name(),
                    "tenantId", owner.getTenant().getId(),
                    "tenantName", owner.getTenant().getName(),
                    "apiKey", owner.getTenant().getApiKey()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Registration error: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Optional<TenantUser> userOpt = tenantAuthService.login(request.getEmail(), request.getPassword());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
            }

            TenantUser user = userOpt.get();
            String token = jwtService.generateTenantUserToken(user);

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "tokenType", "Bearer",
                    "expiresInMs", jwtService.getJwtExpirationMs(),
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole().name(),
                    "tenantId", user.getTenant().getId(),
                    "tenantName", user.getTenant().getName(),
                    "apiKey", user.getTenant().getApiKey()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Login error: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(HttpServletRequest request) {
        String tenantId = TenantContext.getTenantId();
        String userId = (String) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");
        String name = (String) request.getAttribute("name");

        if (tenantId == null || userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        return ResponseEntity.ok(Map.of(
                "id", userId,
                "name", name != null ? name : "",
                "email", email != null ? email : "",
                "role", role != null ? role : "",
                "tenantId", tenantId
        ));
    }

    @GetMapping("/team")
    public ResponseEntity<?> getTeam() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        List<TenantUser> members = tenantAuthService.listTeamMembers(tenantId);
        List<Map<String, Object>> response = members.stream()
                .map(m -> Map.<String, Object>of(
                        "id", m.getId(),
                        "name", m.getName(),
                        "email", m.getEmail(),
                        "role", m.getRole().name(),
                        "createdAt", m.getCreatedAt()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/team")
    public ResponseEntity<?> inviteTeamMember(HttpServletRequest request, @RequestBody InviteRequest body) {
        String tenantId = TenantContext.getTenantId();
        String callerRole = (String) request.getAttribute("role");

        if (tenantId == null || callerRole == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            TenantUser member = tenantAuthService.inviteTeamMember(
                    tenantId,
                    callerRole,
                    body.getName(),
                    body.getEmail(),
                    body.getPassword(),
                    body.getRole()
            );

            return ResponseEntity.ok(Map.of(
                    "id", member.getId(),
                    "name", member.getName(),
                    "email", member.getEmail(),
                    "role", member.getRole().name(),
                    "createdAt", member.getCreatedAt()
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Invite error: " + e.getMessage()));
        }
    }

    public static class RegisterRequest {
        private String companyName;
        private String ownerName;
        private String ownerEmail;
        private String password;

        public String getCompanyName() { return companyName; }
        public void setCompanyName(String companyName) { this.companyName = companyName; }
        public String getOwnerName() { return ownerName; }
        public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
        public String getOwnerEmail() { return ownerEmail; }
        public void setOwnerEmail(String ownerEmail) { this.ownerEmail = ownerEmail; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class InviteRequest {
        private String name;
        private String email;
        private String password;
        private String role;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
}

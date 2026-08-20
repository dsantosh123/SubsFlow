package com.subsflow.tenant.controller;

import com.subsflow.common.context.TenantContext;
import com.subsflow.common.security.JwtService;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import com.subsflow.tenant.repository.TenantRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants")
public class TenantController {

    private final TenantRepository tenantRepository;
    private final JwtService jwtService;

    public TenantController(TenantRepository tenantRepository, JwtService jwtService) {
        this.tenantRepository = tenantRepository;
        this.jwtService = jwtService;
    }

    @PostMapping
    public ResponseEntity<?> onboardTenant(@RequestBody OnboardTenantRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tenant name is required"));
        }

        Tenant tenant = new Tenant();
        tenant.setId("t_" + UUID.randomUUID().toString().substring(0, 8));
        tenant.setName(request.getName().trim());
        tenant.setStatus(TenantStatus.ACTIVE);
        tenant.setApiKey("sk_" + UUID.randomUUID().toString().replace("-", ""));

        Tenant saved = tenantRepository.save(tenant);
        String token = jwtService.generateToken(saved);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "tokenType", "Bearer",
                "expiresInMs", jwtService.getJwtExpirationMs(),
                "id", saved.getId(),
                "name", saved.getName(),
                "status", saved.getStatus().name(),
                "apiKey", saved.getApiKey()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginTenant(@RequestBody LoginTenantRequest request) {
        if (request.getApiKey() == null || request.getApiKey().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "API key is required"));
        }

        return tenantRepository.findByApiKey(request.getApiKey().trim())
                .map(tenant -> {
                    String token = jwtService.generateToken(tenant);
                    return ResponseEntity.ok(Map.of(
                            "token", token,
                            "tokenType", "Bearer",
                            "expiresInMs", jwtService.getJwtExpirationMs(),
                            "id", tenant.getId(),
                            "name", tenant.getName(),
                            "status", tenant.getStatus().name(),
                            "apiKey", tenant.getApiKey()
                    ));
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Tenant not found with provided API key")));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentTenant() {
        String currentTenantId = TenantContext.getTenantId();
        if (currentTenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        return tenantRepository.findById(currentTenantId)
                .map(tenant -> ResponseEntity.ok(Map.of(
                        "id", tenant.getId(),
                        "name", tenant.getName(),
                        "status", tenant.getStatus().name(),
                        "apiKey", tenant.getApiKey()
                )))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Tenant record not found")));
    }

    public static class OnboardTenantRequest {
        private String name;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    public static class LoginTenantRequest {
        private String apiKey;

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }
    }
}

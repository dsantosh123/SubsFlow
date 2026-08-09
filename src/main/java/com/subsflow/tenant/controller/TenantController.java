package com.subsflow.tenant.controller;

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

    public TenantController(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @PostMapping
    public ResponseEntity<Tenant> onboardTenant(@RequestBody OnboardTenantRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Tenant tenant = new Tenant();
        tenant.setId("t_" + UUID.randomUUID().toString().substring(0, 8));
        tenant.setName(request.getName());
        tenant.setStatus(TenantStatus.ACTIVE);
        tenant.setApiKey("sk_" + UUID.randomUUID().toString().replace("-", ""));

        Tenant saved = tenantRepository.save(tenant);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginTenant(@RequestBody LoginTenantRequest request) {
        if (request.getApiKey() == null || request.getApiKey().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "API key is required"));
        }

        return tenantRepository.findByApiKey(request.getApiKey())
                .map(tenant -> ResponseEntity.ok(Map.of(
                        "id", tenant.getId(),
                        "name", tenant.getName(),
                        "status", tenant.getStatus().name(),
                        "apiKey", tenant.getApiKey()
                )))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Tenant not found")));
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

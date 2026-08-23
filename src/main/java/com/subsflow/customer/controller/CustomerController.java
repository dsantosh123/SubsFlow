package com.subsflow.customer.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subsflow.common.context.TenantContext;
import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerStatus;
import com.subsflow.customer.entity.IdempotencyRecord;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.customer.service.CustomerService;
import com.subsflow.customer.service.IdempotencyService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/products/{productId}/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final CustomerSubscriptionRepository subscriptionRepository;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CustomerController(CustomerService customerService,
                              CustomerSubscriptionRepository subscriptionRepository,
                              IdempotencyService idempotencyService) {
        this.customerService = customerService;
        this.subscriptionRepository = subscriptionRepository;
        this.idempotencyService = idempotencyService;
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(HttpServletRequest request,
                                            @PathVariable("productId") String productId,
                                            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
                                            @RequestBody CreateCustomerRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        // Idempotency check
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<IdempotencyRecord> cachedOpt = idempotencyService.getExistingResponse(tenantId, idempotencyKey);
            if (cachedOpt.isPresent()) {
                IdempotencyRecord cached = cachedOpt.get();
                try {
                    Object parsed = objectMapper.readValue(cached.getResponseBody(), Object.class);
                    return ResponseEntity.status(cached.getResponseStatus()).body(parsed);
                } catch (Exception ignored) {}
            }
        }

        try {
            Customer customer = customerService.createCustomer(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    body.getName(),
                    body.getEmail(),
                    body.getExternalCustomerId()
            );

            Map<String, Object> response = mapCustomerToResponse(customer);

            if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
                try {
                    String json = objectMapper.writeValueAsString(response);
                    idempotencyService.recordResponse(tenantId, idempotencyKey, "CUSTOMER_CREATE", customer.getId(), 200, json);
                } catch (Exception ignored) {}
            }

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listCustomers(@PathVariable("productId") String productId,
                                           @RequestParam(value = "query", required = false) String query) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        List<Customer> customers = customerService.listCustomers(tenantId, productId, query);
        List<Map<String, Object>> response = customers.stream()
                .map(this::mapCustomerToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<?> getCustomer(@PathVariable("productId") String productId,
                                         @PathVariable("customerId") String customerId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            Customer customer = customerService.getCustomer(tenantId, productId, customerId);
            return ResponseEntity.ok(mapCustomerToResponse(customer));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{customerId}")
    public ResponseEntity<?> updateCustomer(HttpServletRequest request,
                                            @PathVariable("productId") String productId,
                                            @PathVariable("customerId") String customerId,
                                            @RequestBody UpdateCustomerRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            Customer customer = customerService.updateCustomer(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    customerId,
                    body.getName(),
                    body.getEmail(),
                    body.getExternalCustomerId()
            );

            return ResponseEntity.ok(mapCustomerToResponse(customer));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{customerId}/status")
    public ResponseEntity<?> setCustomerStatus(HttpServletRequest request,
                                               @PathVariable("productId") String productId,
                                               @PathVariable("customerId") String customerId,
                                               @RequestBody StatusUpdateRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            CustomerStatus status = CustomerStatus.valueOf(body.getStatus().toUpperCase());
            Customer customer = customerService.setCustomerStatus(
                    tenantId,
                    role,
                    email != null ? email : "system",
                    productId,
                    customerId,
                    status
            );

            return ResponseEntity.ok(mapCustomerToResponse(customer));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> mapCustomerToResponse(Customer customer) {
        long subCount = subscriptionRepository.countByCustomerId(customer.getId());
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", customer.getId());
        map.put("tenantId", customer.getTenant().getId());
        map.put("productId", customer.getProduct().getId());
        map.put("name", customer.getName());
        map.put("email", customer.getEmail());
        map.put("externalCustomerId", customer.getExternalCustomerId() != null ? customer.getExternalCustomerId() : "");
        map.put("status", customer.getStatus().name());
        map.put("subscriptionsCount", subCount);
        map.put("createdAt", customer.getCreatedAt());
        map.put("updatedAt", customer.getUpdatedAt());
        return map;
    }

    public static class CreateCustomerRequest {
        private String name;
        private String email;
        private String externalCustomerId;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getExternalCustomerId() { return externalCustomerId; }
        public void setExternalCustomerId(String externalCustomerId) { this.externalCustomerId = externalCustomerId; }
    }

    public static class UpdateCustomerRequest {
        private String name;
        private String email;
        private String externalCustomerId;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getExternalCustomerId() { return externalCustomerId; }
        public void setExternalCustomerId(String externalCustomerId) { this.externalCustomerId = externalCustomerId; }
    }

    public static class StatusUpdateRequest {
        private String status;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}

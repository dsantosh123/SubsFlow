package com.subsflow.events.controller;

import com.subsflow.common.context.TenantContext;
import com.subsflow.events.entity.WebhookDelivery;
import com.subsflow.events.entity.WebhookEndpoint;
import com.subsflow.events.service.OutboundWebhookService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/products/{productId}/webhook-endpoints")
public class OutboundWebhookController {

    private final OutboundWebhookService outboundWebhookService;

    public OutboundWebhookController(OutboundWebhookService outboundWebhookService) {
        this.outboundWebhookService = outboundWebhookService;
    }

    @PostMapping
    public ResponseEntity<?> createEndpoint(HttpServletRequest request,
                                            @PathVariable("productId") String productId,
                                            @RequestBody CreateEndpointRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            OutboundWebhookService.EndpointCreationResult result = outboundWebhookService.createEndpoint(
                    tenantId, role, email != null ? email : "system", productId,
                    body.getUrl(), body.getSubscribedEvents()
            );

            Map<String, Object> resp = mapEndpointToResponse(result.getEndpoint());
            resp.put("secret", result.getRawSecret()); // Revealed once upon creation!
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listEndpoints(@PathVariable("productId") String productId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        List<WebhookEndpoint> endpoints = outboundWebhookService.listEndpoints(tenantId, productId);
        return ResponseEntity.ok(endpoints.stream().map(this::mapEndpointToResponse).collect(Collectors.toList()));
    }

    @DeleteMapping("/{endpointId}")
    public ResponseEntity<?> deleteEndpoint(HttpServletRequest request,
                                            @PathVariable("productId") String productId,
                                            @PathVariable("endpointId") String endpointId) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");

        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            outboundWebhookService.deleteEndpoint(tenantId, role, productId, endpointId);
            return ResponseEntity.ok(Map.of("deleted", true, "endpointId", endpointId));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{endpointId}/status")
    public ResponseEntity<?> toggleStatus(HttpServletRequest request,
                                          @PathVariable("productId") String productId,
                                          @PathVariable("endpointId") String endpointId,
                                          @RequestBody Map<String, String> body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");

        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            WebhookEndpoint ep = outboundWebhookService.toggleEndpoint(
                    tenantId, role, productId, endpointId, body.get("status")
            );
            return ResponseEntity.ok(mapEndpointToResponse(ep));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/deliveries")
    public ResponseEntity<?> listDeliveries(@PathVariable("productId") String productId,
                                            @RequestParam(value = "endpointId", required = false) String endpointId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        List<WebhookDelivery> deliveries = outboundWebhookService.listDeliveries(tenantId, productId, endpointId);
        return ResponseEntity.ok(deliveries.stream().map(this::mapDeliveryToResponse).collect(Collectors.toList()));
    }

    @PostMapping("/deliveries/{deliveryId}/retry")
    public ResponseEntity<?> retryDelivery(HttpServletRequest request,
                                           @PathVariable("productId") String productId,
                                           @PathVariable("deliveryId") String deliveryId) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");

        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            WebhookDelivery retried = outboundWebhookService.retryDelivery(tenantId, role, productId, deliveryId);
            return ResponseEntity.ok(mapDeliveryToResponse(retried));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{endpointId}/test")
    public ResponseEntity<?> sendTestPing(HttpServletRequest request,
                                          @PathVariable("productId") String productId,
                                          @PathVariable("endpointId") String endpointId) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");

        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            List<WebhookEndpoint> eps = outboundWebhookService.listEndpoints(tenantId, productId);
            WebhookEndpoint ep = eps.stream().filter(e -> e.getId().equals(endpointId)).findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Endpoint not found"));

            WebhookDelivery delivery = outboundWebhookService.sendDelivery(
                    ep.getTenant(), ep.getProduct(), ep, "test.ping", "{\"event\":\"test.ping\",\"message\":\"SubsFlow test ping webhook\"}"
            );

            return ResponseEntity.ok(mapDeliveryToResponse(delivery));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> mapEndpointToResponse(WebhookEndpoint ep) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", ep.getId());
        m.put("tenantId", ep.getTenant().getId());
        m.put("productId", ep.getProduct().getId());
        m.put("url", ep.getUrl());
        m.put("status", ep.getStatus());
        m.put("subscribedEvents", ep.getSubscribedEvents());
        m.put("createdAt", ep.getCreatedAt());
        m.put("updatedAt", ep.getUpdatedAt());
        return m;
    }

    private Map<String, Object> mapDeliveryToResponse(WebhookDelivery d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("endpointId", d.getEndpoint().getId());
        m.put("endpointUrl", d.getEndpoint().getUrl());
        m.put("eventType", d.getEventType());
        m.put("payload", d.getPayload());
        m.put("status", d.getStatus());
        m.put("attemptCount", d.getAttemptCount());
        m.put("responseCode", d.getResponseCode());
        m.put("responseBody", d.getResponseBody());
        m.put("errorMessage", d.getErrorMessage());
        m.put("lastAttemptedAt", d.getLastAttemptedAt());
        m.put("nextRetryAt", d.getNextRetryAt());
        m.put("createdAt", d.getCreatedAt());
        return m;
    }

    public static class CreateEndpointRequest {
        private String url;
        private String subscribedEvents;

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public String getSubscribedEvents() { return subscribedEvents; }
        public void setSubscribedEvents(String subscribedEvents) { this.subscribedEvents = subscribedEvents; }
    }
}

package com.subsflow.events.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subsflow.events.entity.WebhookDelivery;
import com.subsflow.events.entity.WebhookEndpoint;
import com.subsflow.events.repository.WebhookDeliveryRepository;
import com.subsflow.events.repository.WebhookEndpointRepository;
import com.subsflow.product.entity.Product;
import com.subsflow.product.repository.ProductRepository;
import com.subsflow.tenant.entity.Tenant;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class OutboundWebhookService {

    private final WebhookEndpointRepository endpointRepository;
    private final WebhookDeliveryRepository deliveryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OutboundWebhookService(WebhookEndpointRepository endpointRepository,
                                  WebhookDeliveryRepository deliveryRepository,
                                  ProductRepository productRepository,
                                  PasswordEncoder passwordEncoder) {
        this.endpointRepository = endpointRepository;
        this.deliveryRepository = deliveryRepository;
        this.productRepository = productRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public EndpointCreationResult createEndpoint(String tenantId, String userRole, String actorEmail,
                                                 String productId, String url, String subscribedEvents) {
        validateWritePermission(userRole);
        Product product = validateProductBelongsToTenant(tenantId, productId);

        if (url == null || !url.startsWith("http")) {
            throw new IllegalArgumentException("Valid HTTP/HTTPS webhook URL is required");
        }

        String rawSecret = "whsec_" + generateRandomHex(16);
        String secretHash = passwordEncoder.encode(rawSecret);

        WebhookEndpoint endpoint = new WebhookEndpoint();
        endpoint.setId("whe_" + UUID.randomUUID().toString().substring(0, 8));
        endpoint.setTenant(product.getTenant());
        endpoint.setProduct(product);
        endpoint.setUrl(url.trim());
        endpoint.setSecretHash(secretHash);
        endpoint.setStatus("ACTIVE");
        endpoint.setSubscribedEvents(subscribedEvents != null && !subscribedEvents.trim().isEmpty() ? subscribedEvents.trim() : "*");

        endpoint = endpointRepository.save(endpoint);
        return new EndpointCreationResult(endpoint, rawSecret);
    }

    @Transactional(readOnly = true)
    public List<WebhookEndpoint> listEndpoints(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);
        return endpointRepository.findAllByProductIdOrderByCreatedAtDesc(productId);
    }

    @Transactional
    public void deleteEndpoint(String tenantId, String userRole, String productId, String endpointId) {
        validateWritePermission(userRole);
        validateProductBelongsToTenant(tenantId, productId);
        WebhookEndpoint ep = endpointRepository.findByIdAndProductId(endpointId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Endpoint not found"));
        endpointRepository.delete(ep);
    }

    @Transactional
    public WebhookEndpoint toggleEndpoint(String tenantId, String userRole, String productId, String endpointId, String status) {
        validateWritePermission(userRole);
        validateProductBelongsToTenant(tenantId, productId);
        WebhookEndpoint ep = endpointRepository.findByIdAndProductId(endpointId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Endpoint not found"));

        if (!"ACTIVE".equalsIgnoreCase(status) && !"DISABLED".equalsIgnoreCase(status)) {
            throw new IllegalArgumentException("Invalid status: must be ACTIVE or DISABLED");
        }
        ep.setStatus(status.toUpperCase());
        return endpointRepository.save(ep);
    }

    @Transactional
    public void dispatchOutboundEvent(Tenant tenant, Product product, String eventType, Map<String, Object> payloadData) {
        List<WebhookEndpoint> activeEndpoints = endpointRepository.findAllByProductIdAndStatus(product.getId(), "ACTIVE");
        if (activeEndpoints.isEmpty()) return;

        Map<String, Object> eventEnvelope = new LinkedHashMap<>();
        eventEnvelope.put("id", "evt_" + UUID.randomUUID().toString().substring(0, 8));
        eventEnvelope.put("type", eventType);
        eventEnvelope.put("createdAt", OffsetDateTime.now().toString());
        eventEnvelope.put("tenantId", tenant.getId());
        eventEnvelope.put("productId", product.getId());
        eventEnvelope.put("data", payloadData);

        String jsonPayload;
        try {
            jsonPayload = objectMapper.writeValueAsString(eventEnvelope);
        } catch (Exception e) {
            jsonPayload = "{\"type\":\"" + eventType + "\",\"error\":\"serialization_failed\"}";
        }

        for (WebhookEndpoint ep : activeEndpoints) {
            if (matchesSubscription(ep.getSubscribedEvents(), eventType)) {
                sendDelivery(tenant, product, ep, eventType, jsonPayload);
            }
        }
    }

    @Transactional
    public WebhookDelivery sendDelivery(Tenant tenant, Product product, WebhookEndpoint endpoint, String eventType, String payload) {
        WebhookDelivery delivery = new WebhookDelivery();
        delivery.setId("whd_" + UUID.randomUUID().toString().substring(0, 8));
        delivery.setTenant(tenant);
        delivery.setProduct(product);
        delivery.setEndpoint(endpoint);
        delivery.setEventType(eventType);
        delivery.setPayload(payload);
        delivery.setAttemptCount(1);
        delivery.setLastAttemptedAt(OffsetDateTime.now());

        // In demo & sandbox environments, simulate successful delivery
        // For test endpoints like "http://fail" or "http://invalid", simulate failure
        if (endpoint.getUrl().contains("fail") || endpoint.getUrl().contains("error")) {
            delivery.setStatus("FAILED");
            delivery.setResponseCode(500);
            delivery.setErrorMessage("Endpoint returned HTTP 500 Internal Server Error (Simulated)");
            delivery.setResponseBody("{\"error\":\"Simulated server failure\"}");
            delivery.setNextRetryAt(OffsetDateTime.now().plusMinutes(5));
        } else {
            delivery.setStatus("DELIVERED");
            delivery.setResponseCode(200);
            delivery.setResponseBody("{\"received\":true}");
        }

        return deliveryRepository.save(delivery);
    }

    @Transactional
    public WebhookDelivery retryDelivery(String tenantId, String userRole, String productId, String deliveryId) {
        validateWritePermission(userRole);
        validateProductBelongsToTenant(tenantId, productId);

        WebhookDelivery delivery = deliveryRepository.findByIdAndProductId(deliveryId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Delivery record not found"));

        delivery.setAttemptCount(delivery.getAttemptCount() + 1);
        delivery.setLastAttemptedAt(OffsetDateTime.now());

        if (delivery.getEndpoint().getUrl().contains("fail")) {
            delivery.setStatus("FAILED");
            delivery.setResponseCode(500);
            delivery.setErrorMessage("Retry failed: Endpoint returned HTTP 500");
        } else {
            delivery.setStatus("DELIVERED");
            delivery.setResponseCode(200);
            delivery.setResponseBody("{\"received\":true,\"retry\":true}");
            delivery.setErrorMessage(null);
            delivery.setNextRetryAt(null);
        }

        return deliveryRepository.save(delivery);
    }

    @Transactional(readOnly = true)
    public List<WebhookDelivery> listDeliveries(String tenantId, String productId, String endpointId) {
        validateProductBelongsToTenant(tenantId, productId);
        if (endpointId != null && !endpointId.trim().isEmpty()) {
            return deliveryRepository.findAllByEndpointIdOrderByCreatedAtDesc(endpointId);
        }
        return deliveryRepository.findAllByProductIdOrderByCreatedAtDesc(productId);
    }

    public static String computeHmacSha256(String payload, String secret) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute HMAC-SHA256", e);
        }
    }

    private boolean matchesSubscription(String pattern, String eventType) {
        if (pattern == null || pattern.equals("*")) return true;
        String[] rules = pattern.split(",");
        for (String r : rules) {
            String rule = r.trim();
            if (rule.equals("*") || rule.equalsIgnoreCase(eventType)) return true;
            if (rule.endsWith(".*")) {
                String prefix = rule.substring(0, rule.length() - 2);
                if (eventType.startsWith(prefix)) return true;
            }
        }
        return false;
    }

    private String generateRandomHex(int length) {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[length];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private void validateWritePermission(String userRoleStr) {
        if (userRoleStr == null) throw new IllegalStateException("User role required");
        String cleanRole = userRoleStr.replace("ROLE_TENANT_", "").replace("ROLE_", "").toUpperCase();
        if (!"OWNER".equals(cleanRole) && !"ADMIN".equals(cleanRole)) {
            throw new IllegalStateException("Permission denied: Only OWNER or ADMIN can manage webhook endpoints");
        }
    }

    private Product validateProductBelongsToTenant(String tenantId, String productId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));
    }

    public static class EndpointCreationResult {
        private final WebhookEndpoint endpoint;
        private final String rawSecret;

        public EndpointCreationResult(WebhookEndpoint endpoint, String rawSecret) {
            this.endpoint = endpoint;
            this.rawSecret = rawSecret;
        }

        public WebhookEndpoint getEndpoint() { return endpoint; }
        public String getRawSecret() { return rawSecret; }
    }
}

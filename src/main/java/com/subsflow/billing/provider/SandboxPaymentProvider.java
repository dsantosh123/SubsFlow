package com.subsflow.billing.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class SandboxPaymentProvider implements PaymentProvider {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getProviderName() {
        return "SANDBOX";
    }

    @Override
    public CheckoutSessionResult createCheckoutSession(CheckoutSessionRequest request) {
        String sessionId = "cs_sandbox_" + UUID.randomUUID().toString().substring(0, 12);
        String checkoutUrl = "https://sandbox.subsflow.io/checkout/" + sessionId;
        return new CheckoutSessionResult(true, sessionId, checkoutUrl, null);
    }

    @Override
    public ChargeResult charge(ChargeRequest request) {
        String token = request.getPaymentMethodToken();

        // Simulate decline if card token contains "fail", "decline", or "4002"
        if (token != null && (token.toLowerCase().contains("fail") ||
                token.toLowerCase().contains("decline") ||
                token.contains("4002"))) {
            return new ChargeResult(
                    false,
                    null,
                    "pm_sandbox_declined",
                    "CARD_DECLINED",
                    "Your card was declined by the sandbox bank (Simulated Failure)."
            );
        }

        String paymentId = "ch_sandbox_" + UUID.randomUUID().toString().substring(0, 12);
        String pmRef = (token != null && !token.isEmpty()) ? token : "pm_sandbox_visa_4242";

        return new ChargeResult(true, paymentId, pmRef, null, null);
    }

    @Override
    public RefundResult refund(RefundRequest request) {
        String refundId = "re_sandbox_" + UUID.randomUUID().toString().substring(0, 12);
        return new RefundResult(true, refundId, null);
    }

    @Override
    public boolean verifyWebhookSignature(String payload, String signatureHeader) {
        // In sandbox environment, any signature starting with 't=' or 'sb_sig_' or non-empty is valid
        if (signatureHeader == null || signatureHeader.trim().isEmpty()) {
            return false;
        }
        return true;
    }

    @Override
    public ProviderWebhookEvent parseWebhookEvent(String payload) {
        try {
            Map<String, Object> map = objectMapper.readValue(payload, Map.class);
            String eventId = (String) map.getOrDefault("id", "evt_sandbox_" + UUID.randomUUID().toString().substring(0, 8));
            String eventType = (String) map.getOrDefault("type", "payment.succeeded");
            String paymentId = (String) map.getOrDefault("paymentId", "ch_sandbox_demo");
            String status = (String) map.getOrDefault("status", "SUCCEEDED");

            BigDecimal amount = BigDecimal.ZERO;
            if (map.get("amount") != null) {
                amount = new BigDecimal(String.valueOf(map.get("amount")));
            }
            String currency = (String) map.getOrDefault("currency", "USD");

            Map<String, String> metadata = new HashMap<>();
            if (map.get("metadata") instanceof Map) {
                Map<?, ?> metaMap = (Map<?, ?>) map.get("metadata");
                metaMap.forEach((k, v) -> metadata.put(String.valueOf(k), String.valueOf(v)));
            }

            return new ProviderWebhookEvent(eventId, eventType, paymentId, status, amount, currency, metadata);
        } catch (Exception e) {
            String fallbackId = "evt_fallback_" + UUID.randomUUID().toString().substring(0, 8);
            return new ProviderWebhookEvent(fallbackId, "unknown", null, "FAILED", BigDecimal.ZERO, "USD", Map.of());
        }
    }
}

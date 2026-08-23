package com.subsflow.billing.controller;

import com.subsflow.billing.entity.*;
import com.subsflow.billing.provider.PaymentProvider;
import com.subsflow.billing.service.BillingService;
import com.subsflow.common.context.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/products/{productId}")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/customers/{customerId}/checkout")
    public ResponseEntity<?> createCheckoutSession(HttpServletRequest request,
                                                   @PathVariable("productId") String productId,
                                                   @PathVariable("customerId") String customerId,
                                                   @RequestBody CheckoutRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            PaymentProvider.CheckoutSessionResult result = billingService.createCheckoutSession(
                    tenantId, role, email != null ? email : "system", productId, customerId,
                    body.getSubscriptionId(), body.getSuccessUrl(), body.getCancelUrl(), body.getProvider()
            );

            return ResponseEntity.ok(Map.of(
                    "sessionId", result.getSessionId(),
                    "checkoutUrl", result.getCheckoutUrl(),
                    "provider", body.getProvider() != null ? body.getProvider() : "SANDBOX"
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/customers/{customerId}/pay")
    public ResponseEntity<?> executePayment(HttpServletRequest request,
                                            @PathVariable("productId") String productId,
                                            @PathVariable("customerId") String customerId,
                                            @RequestBody PaymentExecutionRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));
        }

        try {
            CustomerPayment payment = billingService.executePayment(
                    tenantId, role, email != null ? email : "system", productId, customerId,
                    body.getSubscriptionId(), body.getInvoiceId(), body.getPaymentMethodToken(), body.getProvider()
            );

            return ResponseEntity.ok(mapPaymentToResponse(payment));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/invoices")
    public ResponseEntity<?> listProductInvoices(@PathVariable("productId") String productId,
                                                 @RequestParam(value = "customerId", required = false) String customerId,
                                                 @RequestParam(value = "subscriptionId", required = false) String subscriptionId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        List<CustomerInvoice> invoices = billingService.listInvoices(tenantId, productId, customerId, subscriptionId);
        return ResponseEntity.ok(invoices.stream().map(this::mapInvoiceToResponse).collect(Collectors.toList()));
    }

    @GetMapping("/payments")
    public ResponseEntity<?> listProductPayments(@PathVariable("productId") String productId,
                                                 @RequestParam(value = "customerId", required = false) String customerId,
                                                 @RequestParam(value = "subscriptionId", required = false) String subscriptionId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        List<CustomerPayment> payments = billingService.listPayments(tenantId, productId, customerId, subscriptionId);
        return ResponseEntity.ok(payments.stream().map(this::mapPaymentToResponse).collect(Collectors.toList()));
    }

    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<?> getInvoice(@PathVariable("productId") String productId,
                                        @PathVariable("invoiceId") String invoiceId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            CustomerInvoice invoice = billingService.getInvoice(tenantId, productId, invoiceId);
            return ResponseEntity.ok(mapInvoiceToResponse(invoice));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/subscriptions/{subscriptionId}/billing")
    public ResponseEntity<?> getBillingSummary(@PathVariable("productId") String productId,
                                               @PathVariable("subscriptionId") String subscriptionId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            Map<String, Object> summary = billingService.getBillingSummary(tenantId, productId, subscriptionId);
            return ResponseEntity.ok(summary);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/payments/{paymentId}/refund")
    public ResponseEntity<?> refundPayment(HttpServletRequest request,
                                           @PathVariable("productId") String productId,
                                           @PathVariable("paymentId") String paymentId,
                                           @RequestBody RefundRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            PaymentRefund refund = billingService.refundPayment(
                    tenantId, role, email != null ? email : "system", productId, paymentId,
                    body.getAmount(), body.getReason()
            );

            return ResponseEntity.ok(Map.of(
                    "id", refund.getId(),
                    "paymentId", paymentId,
                    "amount", refund.getAmount(),
                    "currency", refund.getCurrency(),
                    "status", refund.getStatus(),
                    "reason", refund.getReason() != null ? refund.getReason() : "",
                    "createdAt", refund.getCreatedAt()
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/subscriptions/{subscriptionId}/renew")
    public ResponseEntity<?> renewSubscription(HttpServletRequest request,
                                               @PathVariable("productId") String productId,
                                               @PathVariable("subscriptionId") String subscriptionId) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");
        String email = (String) request.getAttribute("email");

        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            var renewed = billingService.triggerRenewal(
                    tenantId, role, email != null ? email : "system", productId, subscriptionId
            );

            return ResponseEntity.ok(Map.of(
                    "subscriptionId", renewed.getId(),
                    "status", renewed.getStatus().name(),
                    "currentPeriodStart", renewed.getCurrentPeriodStart(),
                    "currentPeriodEnd", renewed.getCurrentPeriodEnd()
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> mapInvoiceToResponse(CustomerInvoice inv) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", inv.getId());
        m.put("tenantId", inv.getTenant().getId());
        m.put("productId", inv.getProduct().getId());
        m.put("customerId", inv.getCustomer().getId());
        m.put("customerName", inv.getCustomer().getName());
        m.put("customerEmail", inv.getCustomer().getEmail());
        m.put("subscriptionId", inv.getSubscription().getId());
        m.put("invoiceNumber", inv.getInvoiceNumber());
        m.put("status", inv.getStatus().name());
        m.put("subtotal", inv.getSubtotal());
        m.put("discount", inv.getDiscount());
        m.put("tax", inv.getTax());
        m.put("total", inv.getTotal());
        m.put("currency", inv.getCurrency());
        m.put("billingPeriodStart", inv.getBillingPeriodStart());
        m.put("billingPeriodEnd", inv.getBillingPeriodEnd());
        m.put("dueDate", inv.getDueDate());
        m.put("paidAt", inv.getPaidAt());
        m.put("createdAt", inv.getCreatedAt());
        return m;
    }

    private Map<String, Object> mapPaymentToResponse(CustomerPayment pay) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", pay.getId());
        m.put("tenantId", pay.getTenant().getId());
        m.put("productId", pay.getProduct().getId());
        m.put("customerId", pay.getCustomer().getId());
        m.put("customerName", pay.getCustomer().getName());
        m.put("subscriptionId", pay.getSubscription().getId());
        m.put("invoiceId", pay.getInvoice() != null ? pay.getInvoice().getId() : null);
        m.put("provider", pay.getProvider());
        m.put("providerPaymentId", pay.getProviderPaymentId());
        m.put("amount", pay.getAmount());
        m.put("refundedAmount", pay.getRefundedAmount());
        m.put("currency", pay.getCurrency());
        m.put("status", pay.getStatus().name());
        m.put("paymentMethodReference", pay.getPaymentMethodReference());
        m.put("failureCode", pay.getFailureCode());
        m.put("failureMessage", pay.getFailureMessage());
        m.put("paidAt", pay.getPaidAt());
        m.put("createdAt", pay.getCreatedAt());
        return m;
    }

    public static class CheckoutRequest {
        private String subscriptionId;
        private String successUrl;
        private String cancelUrl;
        private String provider;

        public String getSubscriptionId() { return subscriptionId; }
        public void setSubscriptionId(String subscriptionId) { this.subscriptionId = subscriptionId; }
        public String getSuccessUrl() { return successUrl; }
        public void setSuccessUrl(String successUrl) { this.successUrl = successUrl; }
        public String getCancelUrl() { return cancelUrl; }
        public void setCancelUrl(String cancelUrl) { this.cancelUrl = cancelUrl; }
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
    }

    public static class PaymentExecutionRequest {
        private String subscriptionId;
        private String invoiceId;
        private String paymentMethodToken;
        private String provider;

        public String getSubscriptionId() { return subscriptionId; }
        public void setSubscriptionId(String subscriptionId) { this.subscriptionId = subscriptionId; }
        public String getInvoiceId() { return invoiceId; }
        public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }
        public String getPaymentMethodToken() { return paymentMethodToken; }
        public void setPaymentMethodToken(String paymentMethodToken) { this.paymentMethodToken = paymentMethodToken; }
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
    }

    public static class RefundRequest {
        private BigDecimal amount;
        private String reason;

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}

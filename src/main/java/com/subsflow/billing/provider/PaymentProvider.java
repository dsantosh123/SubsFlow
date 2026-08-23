package com.subsflow.billing.provider;

import java.math.BigDecimal;
import java.util.Map;

public interface PaymentProvider {

    String getProviderName();

    CheckoutSessionResult createCheckoutSession(CheckoutSessionRequest request);

    ChargeResult charge(ChargeRequest request);

    RefundResult refund(RefundRequest request);

    boolean verifyWebhookSignature(String payload, String signatureHeader);

    ProviderWebhookEvent parseWebhookEvent(String payload);

    class CheckoutSessionRequest {
        private String customerId;
        private String customerEmail;
        private String subscriptionId;
        private BigDecimal amount;
        private String currency;
        private String successUrl;
        private String cancelUrl;
        private Map<String, String> metadata;

        public String getCustomerId() { return customerId; }
        public void setCustomerId(String customerId) { this.customerId = customerId; }
        public String getCustomerEmail() { return customerEmail; }
        public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
        public String getSubscriptionId() { return subscriptionId; }
        public void setSubscriptionId(String subscriptionId) { this.subscriptionId = subscriptionId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getSuccessUrl() { return successUrl; }
        public void setSuccessUrl(String successUrl) { this.successUrl = successUrl; }
        public String getCancelUrl() { return cancelUrl; }
        public void setCancelUrl(String cancelUrl) { this.cancelUrl = cancelUrl; }
        public Map<String, String> getMetadata() { return metadata; }
        public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }
    }

    class CheckoutSessionResult {
        private boolean success;
        private String sessionId;
        private String checkoutUrl;
        private String errorMessage;

        public CheckoutSessionResult(boolean success, String sessionId, String checkoutUrl, String errorMessage) {
            this.success = success;
            this.sessionId = sessionId;
            this.checkoutUrl = checkoutUrl;
            this.errorMessage = errorMessage;
        }

        public boolean isSuccess() { return success; }
        public String getSessionId() { return sessionId; }
        public String getCheckoutUrl() { return checkoutUrl; }
        public String getErrorMessage() { return errorMessage; }
    }

    class ChargeRequest {
        private String customerId;
        private String subscriptionId;
        private String invoiceId;
        private BigDecimal amount;
        private String currency;
        private String paymentMethodToken;
        private Map<String, String> metadata;

        public String getCustomerId() { return customerId; }
        public void setCustomerId(String customerId) { this.customerId = customerId; }
        public String getSubscriptionId() { return subscriptionId; }
        public void setSubscriptionId(String subscriptionId) { this.subscriptionId = subscriptionId; }
        public String getInvoiceId() { return invoiceId; }
        public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getPaymentMethodToken() { return paymentMethodToken; }
        public void setPaymentMethodToken(String paymentMethodToken) { this.paymentMethodToken = paymentMethodToken; }
        public Map<String, String> getMetadata() { return metadata; }
        public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }
    }

    class ChargeResult {
        private boolean success;
        private String providerPaymentId;
        private String paymentMethodReference;
        private String failureCode;
        private String failureMessage;

        public ChargeResult(boolean success, String providerPaymentId, String paymentMethodReference, String failureCode, String failureMessage) {
            this.success = success;
            this.providerPaymentId = providerPaymentId;
            this.paymentMethodReference = paymentMethodReference;
            this.failureCode = failureCode;
            this.failureMessage = failureMessage;
        }

        public boolean isSuccess() { return success; }
        public String getProviderPaymentId() { return providerPaymentId; }
        public String getPaymentMethodReference() { return paymentMethodReference; }
        public String getFailureCode() { return failureCode; }
        public String getFailureMessage() { return failureMessage; }
    }

    class RefundRequest {
        private String providerPaymentId;
        private BigDecimal amount;
        private String currency;
        private String reason;

        public RefundRequest(String providerPaymentId, BigDecimal amount, String currency, String reason) {
            this.providerPaymentId = providerPaymentId;
            this.amount = amount;
            this.currency = currency;
            this.reason = reason;
        }

        public String getProviderPaymentId() { return providerPaymentId; }
        public BigDecimal getAmount() { return amount; }
        public String getCurrency() { return currency; }
        public String getReason() { return reason; }
    }

    class RefundResult {
        private boolean success;
        private String providerRefundId;
        private String failureMessage;

        public RefundResult(boolean success, String providerRefundId, String failureMessage) {
            this.success = success;
            this.providerRefundId = providerRefundId;
            this.failureMessage = failureMessage;
        }

        public boolean isSuccess() { return success; }
        public String getProviderRefundId() { return providerRefundId; }
        public String getErrorMessage() { return failureMessage; }
    }

    class ProviderWebhookEvent {
        private String eventId;
        private String eventType;
        private String providerPaymentId;
        private String status;
        private BigDecimal amount;
        private String currency;
        private Map<String, String> metadata;

        public ProviderWebhookEvent(String eventId, String eventType, String providerPaymentId, String status, BigDecimal amount, String currency, Map<String, String> metadata) {
            this.eventId = eventId;
            this.eventType = eventType;
            this.providerPaymentId = providerPaymentId;
            this.status = status;
            this.amount = amount;
            this.currency = currency;
            this.metadata = metadata;
        }

        public String getEventId() { return eventId; }
        public String getEventType() { return eventType; }
        public String getProviderPaymentId() { return providerPaymentId; }
        public String getStatus() { return status; }
        public BigDecimal getAmount() { return amount; }
        public String getCurrency() { return currency; }
        public Map<String, String> getMetadata() { return metadata; }
    }
}

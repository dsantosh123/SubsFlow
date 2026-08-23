package com.subsflow.billing.service;

import com.subsflow.billing.entity.*;
import com.subsflow.billing.provider.PaymentProvider;
import com.subsflow.billing.provider.PaymentProviderRegistry;
import com.subsflow.billing.repository.*;
import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.customer.entity.CustomerSubscriptionStatus;
import com.subsflow.customer.entity.SubscriptionHistory;
import com.subsflow.customer.entity.SubscriptionHistoryAction;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.customer.repository.SubscriptionHistoryRepository;
import com.subsflow.plan.entity.BillingInterval;
import com.subsflow.product.entity.Product;
import com.subsflow.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class BillingService {

    private final CustomerInvoiceRepository invoiceRepository;
    private final CustomerPaymentRepository paymentRepository;
    private final PaymentRefundRepository refundRepository;
    private final BillingAccountRepository billingAccountRepository;
    private final PaymentMethodReferenceRepository paymentMethodRepository;
    private final CustomerSubscriptionRepository subscriptionRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final SubscriptionHistoryRepository historyRepository;
    private final PaymentProviderRegistry providerRegistry;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.subsflow.events.service.OutboundWebhookService outboundWebhookService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.subsflow.events.service.NotificationService notificationService;

    public BillingService(CustomerInvoiceRepository invoiceRepository,
                          CustomerPaymentRepository paymentRepository,
                          PaymentRefundRepository refundRepository,
                          BillingAccountRepository billingAccountRepository,
                          PaymentMethodReferenceRepository paymentMethodRepository,
                          CustomerSubscriptionRepository subscriptionRepository,
                          CustomerRepository customerRepository,
                          ProductRepository productRepository,
                          SubscriptionHistoryRepository historyRepository,
                          PaymentProviderRegistry providerRegistry) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.billingAccountRepository = billingAccountRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.historyRepository = historyRepository;
        this.providerRegistry = providerRegistry;
    }

    public void setOutboundWebhookService(com.subsflow.events.service.OutboundWebhookService outboundWebhookService) {
        this.outboundWebhookService = outboundWebhookService;
    }

    public void setNotificationService(com.subsflow.events.service.NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Transactional
    public PaymentProvider.CheckoutSessionResult createCheckoutSession(String tenantId, String userRole, String actorEmail,
                                                                       String productId, String customerId, String subscriptionId,
                                                                       String successUrl, String cancelUrl, String providerName) {
        validateReadOrWritePermission(userRole);
        Product product = validateProductBelongsToTenant(tenantId, productId);
        Customer customer = customerRepository.findByIdAndProductId(customerId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        CustomerSubscription sub = subscriptionRepository.findByIdAndProductId(subscriptionId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        PaymentProvider provider = providerRegistry.getProvider(providerName != null ? providerName : "SANDBOX");

        PaymentProvider.CheckoutSessionRequest req = new PaymentProvider.CheckoutSessionRequest();
        req.setCustomerId(customer.getId());
        req.setCustomerEmail(customer.getEmail());
        req.setSubscriptionId(sub.getId());
        req.setAmount(sub.getPriceAtSubscription());
        req.setCurrency(sub.getCurrencyAtSubscription());
        req.setSuccessUrl(successUrl != null ? successUrl : "https://app.subsflow.io/success");
        req.setCancelUrl(cancelUrl != null ? cancelUrl : "https://app.subsflow.io/cancel");

        return provider.createCheckoutSession(req);
    }

    @Transactional
    public CustomerPayment executePayment(String tenantId, String userRole, String actorEmail,
                                          String productId, String customerId, String subscriptionId,
                                          String invoiceId, String paymentMethodToken, String providerName) {
        validateWritePermission(userRole);
        Product product = validateProductBelongsToTenant(tenantId, productId);
        Customer customer = customerRepository.findByIdAndProductId(customerId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        CustomerSubscription sub = subscriptionRepository.findByIdAndProductId(subscriptionId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        CustomerInvoice invoice = null;
        if (invoiceId != null && !invoiceId.trim().isEmpty()) {
            invoice = invoiceRepository.findByIdAndProductId(invoiceId, productId)
                    .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        } else {
            // Find or create current invoice
            List<CustomerInvoice> openInvoices = invoiceRepository.findAllBySubscriptionIdOrderByCreatedAtDesc(sub.getId());
            if (!openInvoices.isEmpty() && openInvoices.get(0).getStatus() == InvoiceStatus.OPEN) {
                invoice = openInvoices.get(0);
            } else {
                invoice = generateInvoice(product, customer, sub, sub.getCurrentPeriodStart(), sub.getCurrentPeriodEnd());
            }
        }

        PaymentProvider provider = providerRegistry.getProvider(providerName != null ? providerName : "SANDBOX");

        PaymentProvider.ChargeRequest chargeReq = new PaymentProvider.ChargeRequest();
        chargeReq.setCustomerId(customer.getId());
        chargeReq.setSubscriptionId(sub.getId());
        chargeReq.setInvoiceId(invoice.getId());
        chargeReq.setAmount(invoice.getTotal());
        chargeReq.setCurrency(invoice.getCurrency());
        chargeReq.setPaymentMethodToken(paymentMethodToken);

        PaymentProvider.ChargeResult chargeResult = provider.charge(chargeReq);

        OffsetDateTime now = OffsetDateTime.now();
        CustomerPayment payment = new CustomerPayment();
        payment.setId("pay_" + UUID.randomUUID().toString().substring(0, 8));
        payment.setTenant(product.getTenant());
        payment.setProduct(product);
        payment.setCustomer(customer);
        payment.setSubscription(sub);
        payment.setInvoice(invoice);
        payment.setProvider(provider.getProviderName());
        payment.setAmount(invoice.getTotal());
        payment.setRefundedAmount(BigDecimal.ZERO);
        payment.setCurrency(invoice.getCurrency());

        if (chargeResult.isSuccess()) {
            payment.setStatus(PaymentStatus.SUCCEEDED);
            payment.setProviderPaymentId(chargeResult.getProviderPaymentId());
            payment.setPaymentMethodReference(chargeResult.getPaymentMethodReference());
            payment.setPaidAt(now);

            // Settle invoice
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaidAt(now);
            invoiceRepository.save(invoice);

            // Activate subscription if trialing or newly created
            if (sub.getStatus() == CustomerSubscriptionStatus.TRIALING || sub.getStatus() == CustomerSubscriptionStatus.ACTIVE) {
                sub.setStatus(CustomerSubscriptionStatus.ACTIVE);
                subscriptionRepository.save(sub);
            }

            logHistory(sub, "PAYMENT_SUCCEEDED", actorEmail,
                    "Payment of " + payment.getCurrency() + " " + payment.getAmount() + " succeeded. Invoice " + invoice.getInvoiceNumber() + " marked PAID.");

            dispatchPaymentEvent(payment, "payment.succeeded", "Payment Succeeded",
                    "Payment of $" + payment.getAmount() + " " + payment.getCurrency() + " was successfully processed for " + customer.getName());
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureCode(chargeResult.getFailureCode());
            payment.setFailureMessage(chargeResult.getFailureMessage());

            logHistory(sub, "PAYMENT_FAILED", actorEmail,
                    "Payment of " + payment.getCurrency() + " " + payment.getAmount() + " failed: " + chargeResult.getFailureMessage());

            dispatchPaymentEvent(payment, "payment.failed", "Payment Failed",
                    "Payment of $" + payment.getAmount() + " " + payment.getCurrency() + " failed for " + customer.getName() + ": " + chargeResult.getFailureMessage());
        }

        return paymentRepository.save(payment);
    }

    @Transactional
    public PaymentRefund refundPayment(String tenantId, String userRole, String actorEmail,
                                       String productId, String paymentId, BigDecimal refundAmount, String reason) {
        validateRefundPermission(userRole);
        validateProductBelongsToTenant(tenantId, productId);

        CustomerPayment payment = paymentRepository.findByIdAndProductId(paymentId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (payment.getStatus() != PaymentStatus.SUCCEEDED && payment.getStatus() != PaymentStatus.PARTIALLY_REFUNDED) {
            throw new IllegalStateException("Only SUCCEEDED or PARTIALLY_REFUNDED payments can be refunded (current status: " + payment.getStatus() + ")");
        }

        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Refund amount must be greater than zero");
        }

        BigDecimal remainingRefundable = payment.getAmount().subtract(payment.getRefundedAmount());
        if (refundAmount.compareTo(remainingRefundable) > 0) {
            throw new IllegalArgumentException("Refund amount $" + refundAmount + " exceeds remaining refundable balance of $" + remainingRefundable);
        }

        PaymentProvider provider = providerRegistry.getProvider(payment.getProvider());
        PaymentProvider.RefundRequest refundReq = new PaymentProvider.RefundRequest(
                payment.getProviderPaymentId(), refundAmount, payment.getCurrency(), reason
        );

        PaymentProvider.RefundResult refundResult = provider.refund(refundReq);
        if (!refundResult.isSuccess()) {
            throw new IllegalStateException("Provider rejected refund: " + refundResult.getErrorMessage());
        }

        BigDecimal newTotalRefunded = payment.getRefundedAmount().add(refundAmount);
        payment.setRefundedAmount(newTotalRefunded);

        if (newTotalRefunded.compareTo(payment.getAmount()) >= 0) {
            payment.setStatus(PaymentStatus.REFUNDED);
        } else {
            payment.setStatus(PaymentStatus.PARTIALLY_REFUNDED);
        }
        paymentRepository.save(payment);

        PaymentRefund refund = new PaymentRefund();
        refund.setId("ref_" + UUID.randomUUID().toString().substring(0, 8));
        refund.setTenant(payment.getTenant());
        refund.setPayment(payment);
        refund.setAmount(refundAmount);
        refund.setCurrency(payment.getCurrency());
        refund.setReason(reason != null ? reason : "Customer refund request");
        refund.setPerformedBy(actorEmail != null ? actorEmail : "system");
        refund.setProviderRefundId(refundResult.getProviderRefundId());
        refund.setStatus("SUCCEEDED");

        refund = refundRepository.save(refund);

        if (payment.getSubscription() != null) {
            logHistory(payment.getSubscription(), "PAYMENT_REFUNDED", actorEmail,
                    "Refund of " + refund.getCurrency() + " " + refund.getAmount() + " processed (" + payment.getStatus() + "). Reason: " + refund.getReason());

            dispatchPaymentEvent(payment, "payment.refunded", "Payment Refunded",
                    "Refund of $" + refund.getAmount() + " processed for " + payment.getCustomer().getName() + " (" + refund.getReason() + ")");
        }

        return refund;
    }

    @Transactional
    public CustomerSubscription triggerRenewal(String tenantId, String userRole, String actorEmail,
                                               String productId, String subscriptionId) {
        validateWritePermission(userRole);
        Product product = validateProductBelongsToTenant(tenantId, productId);
        CustomerSubscription sub = subscriptionRepository.findByIdAndProductId(subscriptionId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        if (sub.getStatus() == CustomerSubscriptionStatus.CANCELLED || sub.getStatus() == CustomerSubscriptionStatus.EXPIRED) {
            throw new IllegalStateException("Cannot renew a " + sub.getStatus() + " subscription");
        }

        OffsetDateTime newPeriodStart = sub.getCurrentPeriodEnd();
        OffsetDateTime newPeriodEnd = "YEARLY".equalsIgnoreCase(sub.getBillingIntervalAtSubscription())
                ? newPeriodStart.plusYears(1)
                : newPeriodStart.plusMonths(1);

        CustomerInvoice newInvoice = generateInvoice(product, sub.getCustomer(), sub, newPeriodStart, newPeriodEnd);

        // Execute payment for renewal
        CustomerPayment payment = executePayment(
                tenantId, userRole, actorEmail, productId, sub.getCustomer().getId(), sub.getId(),
                newInvoice.getId(), "pm_sandbox_renewal_token", "SANDBOX"
        );

        if (payment.getStatus() == PaymentStatus.SUCCEEDED) {
            sub.setCurrentPeriodStart(newPeriodStart);
            sub.setCurrentPeriodEnd(newPeriodEnd);
            sub.setStatus(CustomerSubscriptionStatus.ACTIVE);
            sub = subscriptionRepository.save(sub);

            logHistory(sub, "RENEWAL_SUCCEEDED", actorEmail,
                    "Subscription renewed until " + newPeriodEnd.toLocalDate() + ". Invoice " + newInvoice.getInvoiceNumber() + " paid.");
        } else {
            logHistory(sub, "RENEWAL_FAILED", actorEmail,
                    "Renewal payment failed for period " + newPeriodStart.toLocalDate() + " to " + newPeriodEnd.toLocalDate());
        }

        return sub;
    }

    @Transactional
    public CustomerInvoice generateInvoice(Product product, Customer customer, CustomerSubscription sub,
                                           OffsetDateTime periodStart, OffsetDateTime periodEnd) {
        String invNum = "INV-" + OffsetDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        CustomerInvoice inv = new CustomerInvoice();
        inv.setId("inv_" + UUID.randomUUID().toString().substring(0, 8));
        inv.setTenant(product.getTenant());
        inv.setProduct(product);
        inv.setCustomer(customer);
        inv.setSubscription(sub);
        inv.setInvoiceNumber(invNum);
        inv.setStatus(InvoiceStatus.OPEN);
        inv.setSubtotal(sub.getPriceAtSubscription());
        inv.setDiscount(BigDecimal.ZERO);
        inv.setTax(BigDecimal.ZERO);
        inv.setTotal(sub.getPriceAtSubscription());
        inv.setCurrency(sub.getCurrencyAtSubscription());
        inv.setBillingPeriodStart(periodStart);
        inv.setBillingPeriodEnd(periodEnd);
        inv.setDueDate(periodStart.plusDays(7));

        return invoiceRepository.save(inv);
    }

    @Transactional(readOnly = true)
    public List<CustomerInvoice> listInvoices(String tenantId, String productId, String customerId, String subscriptionId) {
        validateProductBelongsToTenant(tenantId, productId);
        if (subscriptionId != null && !subscriptionId.trim().isEmpty()) {
            return invoiceRepository.findAllBySubscriptionIdOrderByCreatedAtDesc(subscriptionId);
        }
        if (customerId != null && !customerId.trim().isEmpty()) {
            return invoiceRepository.findAllByCustomerIdOrderByCreatedAtDesc(customerId);
        }
        return invoiceRepository.findAllByProductIdOrderByCreatedAtDesc(productId);
    }

    @Transactional(readOnly = true)
    public List<CustomerPayment> listPayments(String tenantId, String productId, String customerId, String subscriptionId) {
        validateProductBelongsToTenant(tenantId, productId);
        if (subscriptionId != null && !subscriptionId.trim().isEmpty()) {
            return paymentRepository.findAllBySubscriptionIdOrderByCreatedAtDesc(subscriptionId);
        }
        if (customerId != null && !customerId.trim().isEmpty()) {
            return paymentRepository.findAllByCustomerIdOrderByCreatedAtDesc(customerId);
        }
        return paymentRepository.findAllByProductIdOrderByCreatedAtDesc(productId);
    }

    @Transactional(readOnly = true)
    public CustomerInvoice getInvoice(String tenantId, String productId, String invoiceId) {
        validateProductBelongsToTenant(tenantId, productId);
        return invoiceRepository.findByIdAndProductId(invoiceId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found or access denied"));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBillingSummary(String tenantId, String productId, String subscriptionId) {
        validateProductBelongsToTenant(tenantId, productId);
        CustomerSubscription sub = subscriptionRepository.findByIdAndProductId(subscriptionId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

        List<CustomerInvoice> invoices = invoiceRepository.findAllBySubscriptionIdOrderByCreatedAtDesc(sub.getId());
        List<CustomerPayment> payments = paymentRepository.findAllBySubscriptionIdOrderByCreatedAtDesc(sub.getId());

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("subscriptionId", sub.getId());
        summary.put("planName", sub.getPlan().getName());
        summary.put("price", sub.getPriceAtSubscription());
        summary.put("currency", sub.getCurrencyAtSubscription());
        summary.put("billingInterval", sub.getBillingIntervalAtSubscription());
        summary.put("status", sub.getStatus().name());
        summary.put("currentPeriodStart", sub.getCurrentPeriodStart());
        summary.put("currentPeriodEnd", sub.getCurrentPeriodEnd());
        summary.put("invoicesCount", invoices.size());
        summary.put("paymentsCount", payments.size());

        return summary;
    }

    private void logHistory(CustomerSubscription sub, String actionName, String performedBy, String details) {
        SubscriptionHistory history = new SubscriptionHistory();
        history.setId("subhist_" + UUID.randomUUID().toString().substring(0, 8));
        history.setTenant(sub.getTenant());
        history.setProduct(sub.getProduct());
        history.setSubscription(sub);
        history.setCustomer(sub.getCustomer());
        history.setPreviousStatus(sub.getStatus().name());
        history.setNewStatus(sub.getStatus().name());
        history.setPreviousPlanId(sub.getPlan().getId());
        history.setNewPlanId(sub.getPlan().getId());
        history.setAction(SubscriptionHistoryAction.SUBSCRIPTION_CREATED); // fallback or custom detail
        history.setPerformedBy(performedBy != null ? performedBy : "system");
        history.setDetails("[" + actionName + "] " + details);
        historyRepository.save(history);
    }

    private void validateWritePermission(String userRoleStr) {
        if (userRoleStr == null) throw new IllegalStateException("User role required");
        String cleanRole = userRoleStr.replace("ROLE_TENANT_", "").replace("ROLE_", "").toUpperCase();
        if (!"OWNER".equals(cleanRole) && !"ADMIN".equals(cleanRole)) {
            throw new IllegalStateException("Permission denied: Only OWNER or ADMIN can perform this action");
        }
    }

    private void validateRefundPermission(String userRoleStr) {
        if (userRoleStr == null) throw new IllegalStateException("User role required");
        String cleanRole = userRoleStr.replace("ROLE_TENANT_", "").replace("ROLE_", "").toUpperCase();
        if (!"OWNER".equals(cleanRole) && !"ADMIN".equals(cleanRole)) {
            throw new IllegalStateException("Permission denied: Only OWNER or ADMIN can process refunds");
        }
    }

    private void validateReadOrWritePermission(String userRoleStr) {
        if (userRoleStr == null) throw new IllegalStateException("User role required");
    }

    private void dispatchPaymentEvent(CustomerPayment payment, String eventType, String title, String message) {
        if (outboundWebhookService != null) {
            Map<String, Object> data = new HashMap<>();
            data.put("paymentId", payment.getId());
            data.put("amount", payment.getAmount());
            data.put("refundedAmount", payment.getRefundedAmount());
            data.put("currency", payment.getCurrency());
            data.put("status", payment.getStatus().name());
            data.put("provider", payment.getProvider());
            data.put("providerPaymentId", payment.getProviderPaymentId());
            data.put("customerId", payment.getCustomer().getId());
            data.put("customerName", payment.getCustomer().getName());
            data.put("subscriptionId", payment.getSubscription().getId());
            if (payment.getInvoice() != null) {
                data.put("invoiceId", payment.getInvoice().getId());
                data.put("invoiceNumber", payment.getInvoice().getInvoiceNumber());
            }
            outboundWebhookService.dispatchOutboundEvent(payment.getTenant(), payment.getProduct(), eventType, data);
        }
        if (notificationService != null) {
            notificationService.dispatchNotification(
                    payment.getTenant(), payment.getProduct(), payment.getCustomer(), payment.getSubscription(),
                    eventType, title, message
            );
        }
    }

    private Product validateProductBelongsToTenant(String tenantId, String productId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));
    }
}

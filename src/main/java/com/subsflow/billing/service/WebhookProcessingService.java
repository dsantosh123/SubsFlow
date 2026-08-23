package com.subsflow.billing.service;

import com.subsflow.billing.entity.*;
import com.subsflow.billing.provider.PaymentProvider;
import com.subsflow.billing.provider.PaymentProviderRegistry;
import com.subsflow.billing.repository.CustomerInvoiceRepository;
import com.subsflow.billing.repository.CustomerPaymentRepository;
import com.subsflow.billing.repository.WebhookEventRepository;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.customer.entity.CustomerSubscriptionStatus;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class WebhookProcessingService {

    private final PaymentProviderRegistry providerRegistry;
    private final WebhookEventRepository webhookEventRepository;
    private final CustomerPaymentRepository paymentRepository;
    private final CustomerInvoiceRepository invoiceRepository;
    private final CustomerSubscriptionRepository subscriptionRepository;

    public WebhookProcessingService(PaymentProviderRegistry providerRegistry,
                                    WebhookEventRepository webhookEventRepository,
                                    CustomerPaymentRepository paymentRepository,
                                    CustomerInvoiceRepository invoiceRepository,
                                    CustomerSubscriptionRepository subscriptionRepository) {
        this.providerRegistry = providerRegistry;
        this.webhookEventRepository = webhookEventRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Transactional
    public boolean processWebhook(String providerName, String payload, String signatureHeader) {
        PaymentProvider provider = providerRegistry.getProvider(providerName);

        if (!provider.verifyWebhookSignature(payload, signatureHeader)) {
            throw new IllegalArgumentException("Invalid webhook signature for provider " + providerName);
        }

        PaymentProvider.ProviderWebhookEvent event = provider.parseWebhookEvent(payload);

        // Deduplication check
        if (webhookEventRepository.existsByProviderAndEventId(provider.getProviderName(), event.getEventId())) {
            // Already processed idempotently
            return true;
        }

        WebhookEvent webhookEvent = new WebhookEvent();
        webhookEvent.setId("whk_" + UUID.randomUUID().toString().substring(0, 8));
        webhookEvent.setProvider(provider.getProviderName());
        webhookEvent.setEventId(event.getEventId());
        webhookEvent.setEventType(event.getEventType());
        webhookEvent.setPayload(payload);
        webhookEvent.setStatus("PROCESSED");
        webhookEventRepository.save(webhookEvent);

        // Dispatch business updates
        if (event.getProviderPaymentId() != null) {
            Optional<CustomerPayment> paymentOpt = paymentRepository.findByProviderAndProviderPaymentId(
                    provider.getProviderName(), event.getProviderPaymentId()
            );

            if (paymentOpt.isPresent()) {
                CustomerPayment payment = paymentOpt.get();
                OffsetDateTime now = OffsetDateTime.now();

                if ("payment.succeeded".equalsIgnoreCase(event.getEventType())) {
                    payment.setStatus(PaymentStatus.SUCCEEDED);
                    payment.setPaidAt(now);
                    paymentRepository.save(payment);

                    if (payment.getInvoice() != null) {
                        CustomerInvoice invoice = payment.getInvoice();
                        invoice.setStatus(InvoiceStatus.PAID);
                        invoice.setPaidAt(now);
                        invoiceRepository.save(invoice);
                    }

                    if (payment.getSubscription() != null) {
                        CustomerSubscription sub = payment.getSubscription();
                        if (sub.getStatus() == CustomerSubscriptionStatus.TRIALING) {
                            sub.setStatus(CustomerSubscriptionStatus.ACTIVE);
                            subscriptionRepository.save(sub);
                        }
                    }
                } else if ("payment.failed".equalsIgnoreCase(event.getEventType())) {
                    payment.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                } else if ("charge.refunded".equalsIgnoreCase(event.getEventType())) {
                    payment.setStatus(PaymentStatus.REFUNDED);
                    payment.setRefundedAmount(payment.getAmount());
                    paymentRepository.save(payment);
                }
            }
        }

        return true;
    }
}

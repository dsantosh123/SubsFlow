package com.subsflow.payment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subsflow.billing.entity.Invoice;
import com.subsflow.billing.entity.InvoiceStatus;
import com.subsflow.billing.repository.InvoiceRepository;
import com.subsflow.common.entity.OutboxEvent;
import com.subsflow.common.entity.OutboxEventStatus;
import com.subsflow.common.repository.OutboxEventRepository;
import com.subsflow.dunning.entity.PaymentRetryQueue;
import com.subsflow.dunning.entity.RetryStatus;
import com.subsflow.dunning.repository.PaymentRetryQueueRepository;
import com.subsflow.payment.entity.PaymentStatus;
import com.subsflow.payment.entity.PaymentTransaction;
import com.subsflow.payment.gateway.ChargeRequest;
import com.subsflow.payment.gateway.ChargeResponse;
import com.subsflow.payment.gateway.PaymentGatewayClient;
import com.subsflow.payment.repository.PaymentTransactionRepository;
import com.subsflow.subscription.entity.Subscription;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentGatewayClient gatewayClient;
    private final PaymentTransactionRepository transactionRepository;
    private final PaymentRetryQueueRepository retryQueueRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final InvoiceRepository invoiceRepository;
    private final ObjectMapper objectMapper;
    private final com.subsflow.common.metrics.MetricsService metricsService;

    public PaymentServiceImpl(PaymentGatewayClient gatewayClient,
                              PaymentTransactionRepository transactionRepository,
                              PaymentRetryQueueRepository retryQueueRepository,
                              OutboxEventRepository outboxEventRepository,
                              InvoiceRepository invoiceRepository,
                              ObjectMapper objectMapper,
                              com.subsflow.common.metrics.MetricsService metricsService) {
        this.gatewayClient = gatewayClient;
        this.transactionRepository = transactionRepository;
        this.retryQueueRepository = retryQueueRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.invoiceRepository = invoiceRepository;
        this.objectMapper = objectMapper;
        this.metricsService = metricsService;
    }

    @Override
    @Transactional
    @CircuitBreaker(name = "paymentGateway", fallbackMethod = "handlePaymentFallback")
    @Retry(name = "paymentGateway")
    public PaymentTransaction processPayment(Subscription subscription, Invoice invoice, String paymentMethodId, String idempotencyKey) {
        log.info("Initiating payment gateway charge for subscription: {} and invoice: {}", subscription.getId(), invoice.getId());

        ChargeRequest request = new ChargeRequest(invoice.getAmount(), "USD", paymentMethodId);
        
        ChargeResponse response;
        try {
            response = gatewayClient.charge(request);
        } catch (Exception e) {
            log.warn("Payment gateway call failed for invoice {}", invoice.getId(), e);
            throw new RuntimeException(e);
        }

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setId("tx_" + UUID.randomUUID().toString().substring(0, 8));
        transaction.setSubscription(subscription);
        transaction.setInvoice(invoice);
        transaction.setAmount(invoice.getAmount());
        transaction.setIdempotencyKey(idempotencyKey);

        if (response.isSuccess()) {
            transaction.setStatus(PaymentStatus.SUCCESS);
            transaction.setGatewayReference(response.getGatewayReference());
            transactionRepository.save(transaction);

            // Update invoice status to PAID
            invoice.setStatus(InvoiceStatus.PAID);
            invoiceRepository.save(invoice);

            // Write outbox event
            writeOutboxEvent("payment.succeeded", Map.of(
                    "transactionId", transaction.getId(),
                    "subscriptionId", subscription.getId(),
                    "invoiceId", invoice.getId(),
                    "amount", invoice.getAmount(),
                    "gatewayReference", response.getGatewayReference()
            ));

            metricsService.incrementPaymentSuccess();
            log.info("Payment succeeded! Tx: {}", transaction.getId());
        } else {
            transaction.setStatus(PaymentStatus.FAILED);
            transaction.setErrorMessage(response.getErrorMessage());
            transactionRepository.save(transaction);

            // Update invoice status to UNPAID
            invoice.setStatus(InvoiceStatus.UNPAID);
            invoiceRepository.save(invoice);

            // Enqueue for dunning
            enqueueDunning(transaction);

            // Write outbox event
            writeOutboxEvent("payment.failed", Map.of(
                    "transactionId", transaction.getId(),
                    "subscriptionId", subscription.getId(),
                    "invoiceId", invoice.getId(),
                    "amount", invoice.getAmount(),
                    "errorMessage", response.getErrorMessage()
            ));

            metricsService.incrementPaymentFailed();
            log.warn("Payment declined: {}", response.getErrorMessage());
        }

        return transaction;
    }

    // Fallback method when payment fails (e.g. gateway down, timeouts, circuit open)
    @Transactional
    public PaymentTransaction handlePaymentFallback(Subscription subscription, Invoice invoice, String paymentMethodId, String idempotencyKey, Throwable t) {
        log.error("Payment fallback triggered due to exception: {}", t.getMessage());

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setId("tx_" + UUID.randomUUID().toString().substring(0, 8));
        transaction.setSubscription(subscription);
        transaction.setInvoice(invoice);
        transaction.setAmount(invoice.getAmount());
        transaction.setIdempotencyKey(idempotencyKey);
        transaction.setStatus(PaymentStatus.FAILED);
        transaction.setErrorMessage("Payment Gateway Timeout / Unhealthy: " + t.getMessage());
        transactionRepository.save(transaction);

        // Update invoice to UNPAID
        invoice.setStatus(InvoiceStatus.UNPAID);
        invoiceRepository.save(invoice);

        // Enqueue for dunning retry
        enqueueDunning(transaction);

        // Write outbox event
        writeOutboxEvent("payment.failed", Map.of(
                "transactionId", transaction.getId(),
                "subscriptionId", subscription.getId(),
                "invoiceId", invoice.getId(),
                "amount", invoice.getAmount(),
                "errorMessage", transaction.getErrorMessage()
        ));

        metricsService.incrementPaymentFailed();
        return transaction;
    }

    private void enqueueDunning(PaymentTransaction transaction) {
        PaymentRetryQueue retryQueue = new PaymentRetryQueue();
        retryQueue.setId("dunning_" + UUID.randomUUID().toString().substring(0, 8));
        retryQueue.setTransaction(transaction);
        retryQueue.setRetryCount(0);
        // First retry in 1 minute for test simulation
        retryQueue.setNextRetryAt(OffsetDateTime.now().plusMinutes(1));
        retryQueue.setStatus(RetryStatus.PENDING);
        retryQueueRepository.save(retryQueue);
        log.info("Transaction enqueued for dunning retry: {}", retryQueue.getId());
    }

    private void writeOutboxEvent(String eventType, Object payload) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            OutboxEvent event = new OutboxEvent();
            event.setId("evt_" + UUID.randomUUID().toString().substring(0, 8));
            event.setEventType(eventType);
            event.setPayload(jsonPayload);
            event.setStatus(OutboxEventStatus.PENDING);
            outboxEventRepository.save(event);
        } catch (Exception e) {
            log.error("Failed to write outbox event", e);
        }
    }
}

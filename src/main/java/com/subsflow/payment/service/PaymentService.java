package com.subsflow.payment.service;

import com.subsflow.billing.entity.Invoice;
import com.subsflow.payment.entity.PaymentTransaction;
import com.subsflow.subscription.entity.Subscription;

public interface PaymentService {
    /**
     * Attempts to charge a customer's payment method for a specific invoice.
     */
    PaymentTransaction processPayment(Subscription subscription, Invoice invoice, String paymentMethodId, String idempotencyKey);
}

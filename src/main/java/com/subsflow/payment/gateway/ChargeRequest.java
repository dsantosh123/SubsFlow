package com.subsflow.payment.gateway;

import java.math.BigDecimal;

public class ChargeRequest {
    private final BigDecimal amount;
    private final String currency;
    private final String paymentMethodId;

    public ChargeRequest(BigDecimal amount, String currency, String paymentMethodId) {
        this.amount = amount;
        this.currency = currency;
        this.paymentMethodId = paymentMethodId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public String getPaymentMethodId() {
        return paymentMethodId;
    }
}

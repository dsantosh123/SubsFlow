package com.subsflow.payment.gateway;

public interface PaymentGatewayClient {
    /**
     * Executes a charge request against the payment gateway.
     * @throws Exception representing transient connection failures or timeouts
     */
    ChargeResponse charge(ChargeRequest request) throws Exception;
}

package com.subsflow.payment.gateway;

import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.TimeoutException;

@Component
public class SandboxPaymentGatewayClient implements PaymentGatewayClient {

    @Override
    public ChargeResponse charge(ChargeRequest request) throws Exception {
        String paymentMethod = request.getPaymentMethodId();

        if (paymentMethod != null) {
            if (paymentMethod.endsWith("0000")) {
                // Card decline / insufficient funds failure
                return new ChargeResponse(false, null, "Insufficient funds");
            }
            if (paymentMethod.endsWith("9999")) {
                // Simulated gateway latency / timeout
                Thread.sleep(3000);
                throw new TimeoutException("Simulated connection timeout from Sandbox Payment Gateway");
            }
        }

        // Default: Success
        return new ChargeResponse(true, "gw_tx_" + UUID.randomUUID().toString().substring(0, 8), null);
    }
}

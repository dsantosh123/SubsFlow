package com.subsflow.payment.service;

import com.subsflow.payment.gateway.ChargeRequest;
import com.subsflow.payment.gateway.ChargeResponse;
import com.subsflow.payment.gateway.PaymentGatewayClient;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PaymentGatewayResilienceService {

    private static final Logger log = LoggerFactory.getLogger(PaymentGatewayResilienceService.class);

    private final PaymentGatewayClient gatewayClient;

    public PaymentGatewayResilienceService(PaymentGatewayClient gatewayClient) {
        this.gatewayClient = gatewayClient;
    }

    @CircuitBreaker(name = "paymentGateway", fallbackMethod = "fallbackCharge")
    @Retry(name = "paymentGateway")
    public ChargeResponse charge(ChargeRequest request) throws Exception {
        return gatewayClient.charge(request);
    }

    public ChargeResponse fallbackCharge(ChargeRequest request, Throwable throwable) {
        log.warn("Payment gateway fallback triggered for request {} due to {}", request.getPaymentMethodId(), throwable.getMessage());
        return new ChargeResponse(false, null, "Payment Gateway Unavailable");
    }
}

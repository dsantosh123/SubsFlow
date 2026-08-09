package com.subsflow.common.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

@Component
public class MetricsService {

    private final Counter paymentSuccessCounter;
    private final Counter paymentFailedCounter;
    private final Counter dunningRetryCounter;
    private final AtomicReference<Double> activeMrr = new AtomicReference<>(0.0);
    private final AtomicInteger activeSubscriptions = new AtomicInteger(0);

    public MetricsService(MeterRegistry registry) {
        this.paymentSuccessCounter = Counter.builder("subsflow.payment.success")
                .description("Total number of successful payment transactions")
                .register(registry);

        this.paymentFailedCounter = Counter.builder("subsflow.payment.failed")
                .description("Total number of failed payment transactions")
                .register(registry);

        this.dunningRetryCounter = Counter.builder("subsflow.dunning.retries")
                .description("Total number of payment dunning retries executed")
                .register(registry);

        registry.gauge("subsflow.mrr", activeMrr, AtomicReference::get);
        registry.gauge("subsflow.active.subscriptions", activeSubscriptions, AtomicInteger::get);
    }

    public void incrementPaymentSuccess() {
        paymentSuccessCounter.increment();
    }

    public void incrementPaymentFailed() {
        paymentFailedCounter.increment();
    }

    public void incrementDunningRetry() {
        dunningRetryCounter.increment();
    }

    public void updateMrr(double mrrValue) {
        activeMrr.set(mrrValue);
    }

    public void setActiveSubscriptions(int count) {
        activeSubscriptions.set(count);
    }
}

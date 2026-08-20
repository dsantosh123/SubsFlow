package com.subsflow.common.outbox;

import com.subsflow.common.context.TenantContext;
import com.subsflow.common.entity.OutboxEvent;
import com.subsflow.common.entity.OutboxEventStatus;
import com.subsflow.common.repository.OutboxEventRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.repository.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Component
@EnableScheduling
public class OutboxPublisher {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

    private final TenantRepository tenantRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final Executor taskExecutor;

    public OutboxPublisher(TenantRepository tenantRepository,
                           OutboxEventRepository outboxEventRepository,
                           KafkaTemplate<String, String> kafkaTemplate,
                           @Qualifier("subsflowTaskExecutor") Executor taskExecutor) {
        this.tenantRepository = tenantRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.taskExecutor = taskExecutor;
    }

    @Scheduled(fixedDelay = 1000)
    public void publishEvents() {
        List<Tenant> tenants = tenantRepository.findAll();
        if (tenants.isEmpty()) {
            return;
        }

        List<CompletableFuture<Void>> futures = new ArrayList<>();
        for (Tenant tenant : tenants) {
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                try {
                    processTenantEvents(tenant.getId());
                } catch (Exception e) {
                    log.error("Error publishing events for tenant: {}", tenant.getId(), e);
                }
            }, taskExecutor);
            futures.add(future);
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processTenantEvents(String tenantId) {
        try {
            TenantContext.setTenantId(tenantId);
            List<OutboxEvent> pendingEvents = outboxEventRepository.findPendingEventsForProcessing();
            
            if (pendingEvents.isEmpty()) {
                return;
            }

            log.info("Processing {} outbox events for tenant: {}", pendingEvents.size(), tenantId);

            for (OutboxEvent event : pendingEvents) {
                try {
                    String topic = resolveTopic(event.getEventType());
                    
                    try {
                        kafkaTemplate.send(topic, event.getPayload()).get();
                    } catch (Exception publishException) {
                        log.warn("Kafka unavailable for event {}. Leaving it pending for retry", event.getId(), publishException);
                        throw publishException;
                    }

                    event.setStatus(OutboxEventStatus.PROCESSED);
                    outboxEventRepository.save(event);
                    log.info("Successfully published outbox event: {} to topic: {}", event.getId(), topic);
                } catch (Exception e) {
                    log.error("Failed to publish outbox event: {}", event.getId(), e);
                    event.setStatus(OutboxEventStatus.FAILED);
                    outboxEventRepository.save(event);
                }
            }
        } finally {
            TenantContext.clear();
        }
    }

    private String resolveTopic(String eventType) {
        if ("payment.succeeded".equals(eventType)) {
            return "payment.succeeded";
        } else if ("payment.failed".equals(eventType)) {
            return "payment.failed";
        } else if ("subscription.changed".equals(eventType)) {
            return "subscription.changed";
        }
        return "general.events";
    }
}

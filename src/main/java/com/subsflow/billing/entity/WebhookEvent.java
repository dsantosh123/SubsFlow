package com.subsflow.billing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "webhook_event", uniqueConstraints = {
    @UniqueConstraint(name = "uq_webhook_event_provider_id", columnNames = {"provider", "event_id"})
})
@Getter
@Setter
public class WebhookEvent {

    @Id
    private String id;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(name = "event_id", nullable = false, length = 100)
    private String eventId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(nullable = false, length = 20)
    private String status = "PROCESSED";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}

package com.subsflow.billing.repository;

import com.subsflow.billing.entity.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, String> {
    boolean existsByProviderAndEventId(String provider, String eventId);
}

package com.subsflow.events.repository;

import com.subsflow.events.entity.WebhookEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WebhookEndpointRepository extends JpaRepository<WebhookEndpoint, String> {
    List<WebhookEndpoint> findAllByProductIdOrderByCreatedAtDesc(String productId);
    List<WebhookEndpoint> findAllByProductIdAndStatus(String productId, String status);
    Optional<WebhookEndpoint> findByIdAndProductId(String id, String productId);
}

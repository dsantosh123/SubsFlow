package com.subsflow.events.repository;

import com.subsflow.events.entity.WebhookDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WebhookDeliveryRepository extends JpaRepository<WebhookDelivery, String> {
    List<WebhookDelivery> findAllByProductIdOrderByCreatedAtDesc(String productId);
    List<WebhookDelivery> findAllByEndpointIdOrderByCreatedAtDesc(String endpointId);
    Optional<WebhookDelivery> findByIdAndProductId(String id, String productId);
    long countByStatus(String status);
    long countByProductId(String productId);
    List<WebhookDelivery> findTop20ByOrderByCreatedAtDesc();
}

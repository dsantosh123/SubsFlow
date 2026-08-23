package com.subsflow.events.repository;

import com.subsflow.events.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findAllByProductIdOrderByCreatedAtDesc(String productId);
    List<Notification> findAllByProductIdAndStatusOrderByCreatedAtDesc(String productId, String status);
    Optional<Notification> findByIdAndProductId(String id, String productId);
    long countByProductIdAndStatus(String productId, String status);
    long countByStatus(String status);
}

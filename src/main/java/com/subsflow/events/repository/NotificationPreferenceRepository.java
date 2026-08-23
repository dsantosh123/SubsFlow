package com.subsflow.events.repository;

import com.subsflow.events.entity.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, String> {
    List<NotificationPreference> findAllByProductId(String productId);
    Optional<NotificationPreference> findByProductIdAndEventType(String productId, String eventType);
}

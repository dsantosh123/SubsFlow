package com.subsflow.events.controller;

import com.subsflow.events.entity.WebhookDelivery;
import com.subsflow.events.repository.CustomerUsageEventRepository;
import com.subsflow.events.repository.NotificationRepository;
import com.subsflow.events.repository.WebhookDeliveryRepository;
import com.subsflow.events.repository.WebhookEndpointRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/monitoring")
public class AdminMonitoringController {

    private final WebhookDeliveryRepository deliveryRepository;
    private final WebhookEndpointRepository endpointRepository;
    private final CustomerUsageEventRepository usageRepository;
    private final NotificationRepository notificationRepository;

    public AdminMonitoringController(WebhookDeliveryRepository deliveryRepository,
                                     WebhookEndpointRepository endpointRepository,
                                     CustomerUsageEventRepository usageRepository,
                                     NotificationRepository notificationRepository) {
        this.deliveryRepository = deliveryRepository;
        this.endpointRepository = endpointRepository;
        this.usageRepository = usageRepository;
        this.notificationRepository = notificationRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getPlatformMonitoringStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalWebhookDeliveries", deliveryRepository.count());
        stats.put("failedDeliveries", deliveryRepository.countByStatus("FAILED"));
        stats.put("deliveredDeliveries", deliveryRepository.countByStatus("DELIVERED"));
        stats.put("activeEndpoints", endpointRepository.count());
        stats.put("totalUsageEvents", usageRepository.count());
        stats.put("totalNotifications", notificationRepository.count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/recent-deliveries")
    public ResponseEntity<?> getRecentDeliveries() {
        List<WebhookDelivery> deliveries = deliveryRepository.findTop20ByOrderByCreatedAtDesc();
        return ResponseEntity.ok(deliveries.stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.getId());
            m.put("tenantId", d.getTenant().getId());
            m.put("tenantName", d.getTenant().getName());
            m.put("productId", d.getProduct().getId());
            m.put("productName", d.getProduct().getName());
            m.put("endpointUrl", d.getEndpoint().getUrl());
            m.put("eventType", d.getEventType());
            m.put("status", d.getStatus());
            m.put("attemptCount", d.getAttemptCount());
            m.put("responseCode", d.getResponseCode());
            m.put("errorMessage", d.getErrorMessage());
            m.put("createdAt", d.getCreatedAt());
            return m;
        }).collect(Collectors.toList()));
    }
}

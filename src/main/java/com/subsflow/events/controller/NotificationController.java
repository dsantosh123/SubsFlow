package com.subsflow.events.controller;

import com.subsflow.common.context.TenantContext;
import com.subsflow.events.entity.Notification;
import com.subsflow.events.entity.NotificationPreference;
import com.subsflow.events.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/products/{productId}/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<?> listNotifications(@PathVariable("productId") String productId,
                                               @RequestParam(value = "status", required = false) String status) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        List<Notification> notifications = notificationService.listNotifications(tenantId, productId, status);
        return ResponseEntity.ok(notifications.stream().map(this::mapNotificationToResponse).collect(Collectors.toList()));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable("productId") String productId,
                                                  @PathVariable("notificationId") String notificationId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            Notification notif = notificationService.markNotificationRead(tenantId, productId, notificationId);
            return ResponseEntity.ok(mapNotificationToResponse(notif));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/preferences")
    public ResponseEntity<?> getPreferences(@PathVariable("productId") String productId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        List<NotificationPreference> prefs = notificationService.getPreferences(tenantId, productId);
        return ResponseEntity.ok(prefs.stream().map(this::mapPreferenceToResponse).collect(Collectors.toList()));
    }

    @PutMapping("/preferences")
    public ResponseEntity<?> savePreference(HttpServletRequest request,
                                            @PathVariable("productId") String productId,
                                            @RequestBody SavePreferenceRequest body) {
        String tenantId = TenantContext.getTenantId();
        String role = (String) request.getAttribute("role");

        if (tenantId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthenticated session"));

        try {
            NotificationPreference pref = notificationService.savePreference(
                    tenantId, role, productId, body.getEventType(), body.isEmailEnabled(), body.isInAppEnabled()
            );
            return ResponseEntity.ok(mapPreferenceToResponse(pref));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> mapNotificationToResponse(Notification n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.getId());
        m.put("tenantId", n.getTenant().getId());
        m.put("productId", n.getProduct().getId());
        m.put("customerId", n.getCustomer() != null ? n.getCustomer().getId() : null);
        m.put("customerName", n.getCustomer() != null ? n.getCustomer().getName() : null);
        m.put("subscriptionId", n.getSubscription() != null ? n.getSubscription().getId() : null);
        m.put("eventType", n.getEventType());
        m.put("channel", n.getChannel());
        m.put("title", n.getTitle());
        m.put("message", n.getMessage());
        m.put("status", n.getStatus());
        m.put("readAt", n.getReadAt());
        m.put("createdAt", n.getCreatedAt());
        return m;
    }

    private Map<String, Object> mapPreferenceToResponse(NotificationPreference p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("productId", p.getProduct().getId());
        m.put("eventType", p.getEventType());
        m.put("emailEnabled", p.isEmailEnabled());
        m.put("inAppEnabled", p.isInAppEnabled());
        m.put("updatedAt", p.getUpdatedAt());
        return m;
    }

    public static class SavePreferenceRequest {
        private String eventType;
        private boolean emailEnabled = true;
        private boolean inAppEnabled = true;

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public boolean isEmailEnabled() { return emailEnabled; }
        public void setEmailEnabled(boolean emailEnabled) { this.emailEnabled = emailEnabled; }
        public boolean isInAppEnabled() { return inAppEnabled; }
        public void setInAppEnabled(boolean inAppEnabled) { this.inAppEnabled = inAppEnabled; }
    }
}

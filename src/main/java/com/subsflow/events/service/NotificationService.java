package com.subsflow.events.service;

import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.events.entity.Notification;
import com.subsflow.events.entity.NotificationPreference;
import com.subsflow.events.repository.NotificationPreferenceRepository;
import com.subsflow.events.repository.NotificationRepository;
import com.subsflow.product.entity.Product;
import com.subsflow.product.repository.ProductRepository;
import com.subsflow.tenant.entity.Tenant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final ProductRepository productRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               NotificationPreferenceRepository preferenceRepository,
                               ProductRepository productRepository) {
        this.notificationRepository = notificationRepository;
        this.preferenceRepository = preferenceRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public void dispatchNotification(Tenant tenant, Product product, Customer customer,
                                     CustomerSubscription subscription, String eventType,
                                     String title, String message) {
        Optional<NotificationPreference> prefOpt = preferenceRepository.findByProductIdAndEventType(product.getId(), eventType);

        boolean emailEnabled = true;
        boolean inAppEnabled = true;

        if (prefOpt.isPresent()) {
            emailEnabled = prefOpt.get().isEmailEnabled();
            inAppEnabled = prefOpt.get().isInAppEnabled();
        }

        if (inAppEnabled) {
            Notification notif = new Notification();
            notif.setId("notif_" + UUID.randomUUID().toString().substring(0, 8));
            notif.setTenant(tenant);
            notif.setProduct(product);
            notif.setCustomer(customer);
            notif.setSubscription(subscription);
            notif.setEventType(eventType);
            notif.setChannel("IN_APP");
            notif.setTitle(title);
            notif.setMessage(message);
            notif.setStatus("SENT");
            notificationRepository.save(notif);
        }

        if (emailEnabled) {
            Notification notif = new Notification();
            notif.setId("notif_" + UUID.randomUUID().toString().substring(0, 8));
            notif.setTenant(tenant);
            notif.setProduct(product);
            notif.setCustomer(customer);
            notif.setSubscription(subscription);
            notif.setEventType(eventType);
            notif.setChannel("EMAIL");
            notif.setTitle(title);
            notif.setMessage(message);
            notif.setStatus("SENT");
            notificationRepository.save(notif);
        }
    }

    @Transactional(readOnly = true)
    public List<Notification> listNotifications(String tenantId, String productId, String status) {
        validateProductBelongsToTenant(tenantId, productId);
        if (status != null && !status.trim().isEmpty()) {
            return notificationRepository.findAllByProductIdAndStatusOrderByCreatedAtDesc(productId, status.toUpperCase());
        }
        return notificationRepository.findAllByProductIdOrderByCreatedAtDesc(productId);
    }

    @Transactional
    public Notification markNotificationRead(String tenantId, String productId, String notificationId) {
        validateProductBelongsToTenant(tenantId, productId);
        Notification notif = notificationRepository.findByIdAndProductId(notificationId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notif.setStatus("READ");
        notif.setReadAt(OffsetDateTime.now());
        return notificationRepository.save(notif);
    }

    @Transactional(readOnly = true)
    public List<NotificationPreference> getPreferences(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);
        return preferenceRepository.findAllByProductId(productId);
    }

    @Transactional
    public NotificationPreference savePreference(String tenantId, String userRole, String productId,
                                                 String eventType, boolean emailEnabled, boolean inAppEnabled) {
        validateWritePermission(userRole);
        Product product = validateProductBelongsToTenant(tenantId, productId);

        NotificationPreference pref = preferenceRepository.findByProductIdAndEventType(productId, eventType)
                .orElseGet(() -> {
                    NotificationPreference np = new NotificationPreference();
                    np.setId("pref_" + UUID.randomUUID().toString().substring(0, 8));
                    np.setTenant(product.getTenant());
                    np.setProduct(product);
                    np.setEventType(eventType);
                    return np;
                });

        pref.setEmailEnabled(emailEnabled);
        pref.setInAppEnabled(inAppEnabled);
        return preferenceRepository.save(pref);
    }

    private void validateWritePermission(String userRoleStr) {
        if (userRoleStr == null) throw new IllegalStateException("User role required");
        String cleanRole = userRoleStr.replace("ROLE_TENANT_", "").replace("ROLE_", "").toUpperCase();
        if (!"OWNER".equals(cleanRole) && !"ADMIN".equals(cleanRole)) {
            throw new IllegalStateException("Permission denied: Only OWNER or ADMIN can configure notification preferences");
        }
    }

    private Product validateProductBelongsToTenant(String tenantId, String productId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));
    }
}

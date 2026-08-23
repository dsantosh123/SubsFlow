package com.subsflow.events;

import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.events.entity.Notification;
import com.subsflow.events.entity.NotificationPreference;
import com.subsflow.events.repository.NotificationPreferenceRepository;
import com.subsflow.events.repository.NotificationRepository;
import com.subsflow.events.service.NotificationService;
import com.subsflow.product.entity.Product;
import com.subsflow.product.entity.ProductStatus;
import com.subsflow.product.repository.ProductRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationPreferenceRepository preferenceRepository;
    @Mock private ProductRepository productRepository;

    private NotificationService notificationService;
    private Tenant testTenant;
    private Product testProduct;
    private Customer testCustomer;
    private CustomerSubscription testSub;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, preferenceRepository, productRepository);

        testTenant = new Tenant();
        testTenant.setId("t_netflix");
        testTenant.setName("Netflix");
        testTenant.setStatus(TenantStatus.ACTIVE);

        testProduct = new Product();
        testProduct.setId("prod_streaming");
        testProduct.setName("Netflix Streaming");
        testProduct.setTenant(testTenant);
        testProduct.setStatus(ProductStatus.ACTIVE);

        testCustomer = new Customer();
        testCustomer.setId("cust_john");
        testCustomer.setName("John Doe");

        testSub = new CustomerSubscription();
        testSub.setId("sub_123");
    }

    @Test
    @DisplayName("Dispatch notification creates both IN_APP and EMAIL channels by default")
    void testDefaultNotificationDispatch() {
        when(preferenceRepository.findByProductIdAndEventType("prod_streaming", "PAYMENT_SUCCEEDED"))
                .thenReturn(Optional.empty());

        notificationService.dispatchNotification(
                testTenant, testProduct, testCustomer, testSub, "PAYMENT_SUCCEEDED",
                "Payment Received", "Your payment was processed successfully."
        );

        // Saved 2 notifications: 1 for IN_APP, 1 for EMAIL
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    @DisplayName("Notification preferences suppress disabled channels")
    void testNotificationPreferenceSuppression() {
        NotificationPreference pref = new NotificationPreference();
        pref.setEventType("PAYMENT_FAILED");
        pref.setEmailEnabled(true);
        pref.setInAppEnabled(false); // In-app disabled

        when(preferenceRepository.findByProductIdAndEventType("prod_streaming", "PAYMENT_FAILED"))
                .thenReturn(Optional.of(pref));

        notificationService.dispatchNotification(
                testTenant, testProduct, testCustomer, testSub, "PAYMENT_FAILED",
                "Payment Failed", "Card was declined."
        );

        // Saved only 1 notification (EMAIL only)
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("Marking notification as read sets status to READ and updates readAt")
    void testMarkNotificationRead() {
        Notification notif = new Notification();
        notif.setId("notif_1");
        notif.setStatus("SENT");

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(notificationRepository.findByIdAndProductId("notif_1", "prod_streaming"))
                .thenReturn(Optional.of(notif));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        Notification readNotif = notificationService.markNotificationRead("t_netflix", "prod_streaming", "notif_1");

        assertNotNull(readNotif);
        assertEquals("READ", readNotif.getStatus());
        assertNotNull(readNotif.getReadAt());
    }
}

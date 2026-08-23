package com.subsflow.events;

import com.subsflow.events.entity.WebhookDelivery;
import com.subsflow.events.entity.WebhookEndpoint;
import com.subsflow.events.repository.WebhookDeliveryRepository;
import com.subsflow.events.repository.WebhookEndpointRepository;
import com.subsflow.events.service.OutboundWebhookService;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboundWebhookServiceTest {

    @Mock private WebhookEndpointRepository endpointRepository;
    @Mock private WebhookDeliveryRepository deliveryRepository;
    @Mock private ProductRepository productRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private OutboundWebhookService webhookService;
    private Tenant testTenant;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        webhookService = new OutboundWebhookService(endpointRepository, deliveryRepository, productRepository, passwordEncoder);

        testTenant = new Tenant();
        testTenant.setId("t_netflix");
        testTenant.setName("Netflix");
        testTenant.setStatus(TenantStatus.ACTIVE);

        testProduct = new Product();
        testProduct.setId("prod_streaming");
        testProduct.setName("Netflix Streaming");
        testProduct.setTenant(testTenant);
        testProduct.setStatus(ProductStatus.ACTIVE);
    }

    @Test
    @DisplayName("Create endpoint generates raw secret starting with whsec_ and hashes it for DB storage")
    void testCreateEndpoint() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(passwordEncoder.encode(any(String.class))).thenReturn("bcrypt_hashed_secret");
        when(endpointRepository.save(any(WebhookEndpoint.class))).thenAnswer(inv -> inv.getArgument(0));

        OutboundWebhookService.EndpointCreationResult result = webhookService.createEndpoint(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming",
                "https://api.netflix.com/webhook", "subscription.*,payment.*"
        );

        assertNotNull(result);
        assertNotNull(result.getRawSecret());
        assertTrue(result.getRawSecret().startsWith("whsec_"));
        assertEquals("ACTIVE", result.getEndpoint().getStatus());
        assertEquals("bcrypt_hashed_secret", result.getEndpoint().getSecretHash());
        assertEquals("subscription.*,payment.*", result.getEndpoint().getSubscribedEvents());

        verify(endpointRepository, times(1)).save(any(WebhookEndpoint.class));
    }

    @Test
    @DisplayName("Dispatch event delivers payload to matching active endpoints")
    void testDispatchOutboundEvent() {
        WebhookEndpoint ep = new WebhookEndpoint();
        ep.setId("whe_1");
        ep.setTenant(testTenant);
        ep.setProduct(testProduct);
        ep.setUrl("https://api.netflix.com/webhook");
        ep.setStatus("ACTIVE");
        ep.setSubscribedEvents("subscription.*");

        when(endpointRepository.findAllByProductIdAndStatus("prod_streaming", "ACTIVE"))
                .thenReturn(List.of(ep));
        when(deliveryRepository.save(any(WebhookDelivery.class))).thenAnswer(inv -> inv.getArgument(0));

        webhookService.dispatchOutboundEvent(
                testTenant, testProduct, "subscription.created", Map.of("subscriptionId", "sub_100")
        );

        verify(deliveryRepository, times(1)).save(any(WebhookDelivery.class));
    }

    @Test
    @DisplayName("HMAC-SHA256 signature produces deterministic valid hex output")
    void testHmacSha256Signature() {
        String payload = "{\"event\":\"subscription.created\"}";
        String secret = "whsec_test_secret_12345";

        String signature1 = OutboundWebhookService.computeHmacSha256(payload, secret);
        String signature2 = OutboundWebhookService.computeHmacSha256(payload, secret);

        assertNotNull(signature1);
        assertEquals(signature1, signature2);
        assertTrue(signature1.length() >= 64);
    }

    @Test
    @DisplayName("DEVELOPER cannot create webhook endpoints")
    void testDeveloperCannotCreateEndpoint() {
        assertThrows(IllegalStateException.class, () -> {
            webhookService.createEndpoint(
                    "t_netflix", "DEVELOPER", "dev@netflix.com", "prod_streaming",
                    "https://api.netflix.com/wh", "*"
            );
        });
    }
}

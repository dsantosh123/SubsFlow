package com.subsflow.customer;

import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerStatus;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.service.CustomerService;
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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ProductRepository productRepository;

    private CustomerService customerService;
    private Tenant testTenant;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        customerService = new CustomerService(customerRepository, productRepository);

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
    @DisplayName("OWNER can create customer with unique external ID")
    void testCreateCustomerSuccess() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.existsByProductIdAndExternalCustomerId("prod_streaming", "ext_123"))
                .thenReturn(false);
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        Customer customer = customerService.createCustomer(
                "t_netflix",
                "OWNER",
                "owner@netflix.com",
                "prod_streaming",
                "John Doe",
                "john@example.com",
                "ext_123"
        );

        assertNotNull(customer);
        assertEquals("John Doe", customer.getName());
        assertEquals("john@example.com", customer.getEmail());
        assertEquals("ext_123", customer.getExternalCustomerId());
        assertEquals(CustomerStatus.ACTIVE, customer.getStatus());

        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    @DisplayName("Duplicate externalCustomerId on same product is rejected")
    void testDuplicateExternalIdRejected() {
        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.existsByProductIdAndExternalCustomerId("prod_streaming", "ext_123"))
                .thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> {
            customerService.createCustomer(
                    "t_netflix",
                    "ADMIN",
                    "admin@netflix.com",
                    "prod_streaming",
                    "John Clone",
                    "john2@example.com",
                    "ext_123"
            );
        });

        verify(customerRepository, never()).save(any());
    }

    @Test
    @DisplayName("DEVELOPER cannot create or modify customer")
    void testDeveloperCannotCreateCustomer() {
        assertThrows(IllegalStateException.class, () -> {
            customerService.createCustomer(
                    "t_netflix",
                    "DEVELOPER",
                    "dev@netflix.com",
                    "prod_streaming",
                    "Jane",
                    "jane@example.com",
                    null
            );
        });
    }

    @Test
    @DisplayName("Customer status can be toggled to INACTIVE")
    void testToggleCustomerStatus() {
        Customer customer = new Customer();
        customer.setId("cust_123");
        customer.setName("Jane");
        customer.setTenant(testTenant);
        customer.setProduct(testProduct);
        customer.setStatus(CustomerStatus.ACTIVE);

        when(productRepository.findByIdAndTenantId("prod_streaming", "t_netflix"))
                .thenReturn(Optional.of(testProduct));
        when(customerRepository.findByIdAndProductId("cust_123", "prod_streaming"))
                .thenReturn(Optional.of(customer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        Customer updated = customerService.setCustomerStatus(
                "t_netflix", "OWNER", "owner@netflix.com", "prod_streaming", "cust_123", CustomerStatus.INACTIVE
        );

        assertEquals(CustomerStatus.INACTIVE, updated.getStatus());
    }
}

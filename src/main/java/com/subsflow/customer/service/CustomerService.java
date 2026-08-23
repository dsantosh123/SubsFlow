package com.subsflow.customer.service;

import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerStatus;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.product.entity.Product;
import com.subsflow.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public CustomerService(CustomerRepository customerRepository, ProductRepository productRepository) {
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public Customer createCustomer(String tenantId, String userRole, String actorEmail, String productId,
                                   String name, String email, String externalCustomerId) {
        validateWritePermission(userRole);
        Product product = validateProductBelongsToTenant(tenantId, productId);

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Customer name is required");
        }
        if (email == null || email.trim().isEmpty() || !email.contains("@")) {
            throw new IllegalArgumentException("Valid customer email is required");
        }

        String cleanExtId = (externalCustomerId != null && !externalCustomerId.trim().isEmpty())
                ? externalCustomerId.trim() : null;

        if (cleanExtId != null && customerRepository.existsByProductIdAndExternalCustomerId(productId, cleanExtId)) {
            throw new IllegalArgumentException("A customer with external ID '" + cleanExtId + "' already exists for this product");
        }

        Customer customer = new Customer();
        customer.setId("cust_" + UUID.randomUUID().toString().substring(0, 8));
        customer.setTenant(product.getTenant());
        customer.setProduct(product);
        customer.setName(name.trim());
        customer.setEmail(email.trim().toLowerCase());
        customer.setExternalCustomerId(cleanExtId);
        customer.setStatus(CustomerStatus.ACTIVE);

        return customerRepository.save(customer);
    }

    @Transactional(readOnly = true)
    public List<Customer> listCustomers(String tenantId, String productId, String query) {
        validateProductBelongsToTenant(tenantId, productId);

        if (query != null && !query.trim().isEmpty()) {
            return customerRepository.searchCustomers(productId, query.trim());
        }
        return customerRepository.findAllByProductIdOrderByCreatedAtDesc(productId);
    }

    @Transactional(readOnly = true)
    public Customer getCustomer(String tenantId, String productId, String customerId) {
        validateProductBelongsToTenant(tenantId, productId);
        return customerRepository.findByIdAndProductId(customerId, productId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found or does not belong to this product"));
    }

    @Transactional
    public Customer updateCustomer(String tenantId, String userRole, String actorEmail, String productId,
                                   String customerId, String name, String email, String externalCustomerId) {
        validateWritePermission(userRole);
        Customer customer = getCustomer(tenantId, productId, customerId);

        if (name != null && !name.trim().isEmpty()) {
            customer.setName(name.trim());
        }
        if (email != null && !email.trim().isEmpty()) {
            if (!email.contains("@")) {
                throw new IllegalArgumentException("Valid customer email is required");
            }
            customer.setEmail(email.trim().toLowerCase());
        }

        if (externalCustomerId != null) {
            String cleanExtId = externalCustomerId.trim().isEmpty() ? null : externalCustomerId.trim();
            if (cleanExtId != null && customerRepository.existsByProductIdAndExternalCustomerIdAndIdNot(productId, cleanExtId, customerId)) {
                throw new IllegalArgumentException("A customer with external ID '" + cleanExtId + "' already exists for this product");
            }
            customer.setExternalCustomerId(cleanExtId);
        }

        return customerRepository.save(customer);
    }

    @Transactional
    public Customer setCustomerStatus(String tenantId, String userRole, String actorEmail, String productId,
                                      String customerId, CustomerStatus status) {
        validateWritePermission(userRole);
        Customer customer = getCustomer(tenantId, productId, customerId);
        customer.setStatus(status);
        return customerRepository.save(customer);
    }

    private void validateWritePermission(String userRoleStr) {
        if (userRoleStr == null) {
            throw new IllegalStateException("User role context is required");
        }
        String cleanRole = userRoleStr.replace("ROLE_TENANT_", "").replace("ROLE_", "").toUpperCase();
        if (!"OWNER".equals(cleanRole) && !"ADMIN".equals(cleanRole)) {
            throw new IllegalStateException("Permission denied: Only OWNER or ADMIN can perform this action");
        }
    }

    private Product validateProductBelongsToTenant(String tenantId, String productId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));
    }
}

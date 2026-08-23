package com.subsflow.admin.service;

import com.subsflow.billing.entity.CustomerInvoice;
import com.subsflow.billing.entity.CustomerPayment;
import com.subsflow.billing.repository.CustomerInvoiceRepository;
import com.subsflow.billing.repository.CustomerPaymentRepository;
import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.product.entity.Product;
import com.subsflow.product.repository.ProductRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AdminSearchService {

    private final TenantRepository tenantRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final CustomerSubscriptionRepository subscriptionRepository;
    private final CustomerPaymentRepository paymentRepository;
    private final CustomerInvoiceRepository invoiceRepository;

    public AdminSearchService(TenantRepository tenantRepository,
                              ProductRepository productRepository,
                              CustomerRepository customerRepository,
                              CustomerSubscriptionRepository subscriptionRepository,
                              CustomerPaymentRepository paymentRepository,
                              CustomerInvoiceRepository invoiceRepository) {
        this.tenantRepository = tenantRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> globalSearch(String query) {
        if (query == null || query.trim().length() < 2) {
            return Map.of(
                    "tenants", List.of(),
                    "products", List.of(),
                    "customers", List.of(),
                    "subscriptions", List.of(),
                    "payments", List.of()
            );
        }

        String q = query.trim().toLowerCase();

        // 1. Tenants
        List<Map<String, Object>> matchedTenants = new ArrayList<>();
        for (Tenant t : tenantRepository.findAll()) {
            if (t.getName().toLowerCase().contains(q) || (t.getContactEmail() != null && t.getContactEmail().toLowerCase().contains(q))) {
                matchedTenants.add(Map.of(
                        "id", t.getId(),
                        "name", t.getName(),
                        "status", t.getStatus().name(),
                        "contactEmail", t.getContactEmail() != null ? t.getContactEmail() : ""
                ));
            }
            if (matchedTenants.size() >= 10) break;
        }

        // 2. Products
        List<Map<String, Object>> matchedProducts = new ArrayList<>();
        for (Product p : productRepository.findAll()) {
            if (p.getName().toLowerCase().contains(q) || (p.getDescription() != null && p.getDescription().toLowerCase().contains(q))) {
                matchedProducts.add(Map.of(
                        "id", p.getId(),
                        "name", p.getName(),
                        "status", p.getStatus().name(),
                        "tenantId", p.getTenant().getId(),
                        "tenantName", p.getTenant().getName()
                ));
            }
            if (matchedProducts.size() >= 10) break;
        }

        // 3. Customers
        List<Map<String, Object>> matchedCustomers = new ArrayList<>();
        for (Customer c : customerRepository.findAll()) {
            if (c.getName().toLowerCase().contains(q) || c.getEmail().toLowerCase().contains(q) || c.getId().toLowerCase().contains(q)) {
                matchedCustomers.add(Map.of(
                        "id", c.getId(),
                        "name", c.getName(),
                        "email", c.getEmail(),
                        "status", c.getStatus().name(),
                        "tenantId", c.getTenant().getId(),
                        "tenantName", c.getTenant().getName(),
                        "productId", c.getProduct().getId(),
                        "productName", c.getProduct().getName()
                ));
            }
            if (matchedCustomers.size() >= 10) break;
        }

        // 4. Subscriptions
        List<Map<String, Object>> matchedSubscriptions = new ArrayList<>();
        for (CustomerSubscription s : subscriptionRepository.findAll()) {
            if (s.getId().toLowerCase().contains(q) || s.getCustomer().getName().toLowerCase().contains(q) || s.getCustomer().getEmail().toLowerCase().contains(q)) {
                matchedSubscriptions.add(Map.of(
                        "id", s.getId(),
                        "status", s.getStatus().name(),
                        "customerName", s.getCustomer().getName(),
                        "customerEmail", s.getCustomer().getEmail(),
                        "planName", s.getPlan().getName(),
                        "tenantId", s.getTenant().getId(),
                        "tenantName", s.getTenant().getName(),
                        "productId", s.getProduct().getId(),
                        "productName", s.getProduct().getName()
                ));
            }
            if (matchedSubscriptions.size() >= 10) break;
        }

        // 5. Payments
        List<Map<String, Object>> matchedPayments = new ArrayList<>();
        for (CustomerPayment p : paymentRepository.findAll()) {
            if (p.getId().toLowerCase().contains(q) || (p.getProviderPaymentId() != null && p.getProviderPaymentId().toLowerCase().contains(q))
                    || p.getCustomer().getName().toLowerCase().contains(q)) {
                matchedPayments.add(Map.of(
                        "id", p.getId(),
                        "amount", p.getAmount(),
                        "currency", p.getCurrency(),
                        "status", p.getStatus().name(),
                        "customerName", p.getCustomer().getName(),
                        "tenantId", p.getTenant().getId(),
                        "tenantName", p.getTenant().getName(),
                        "productId", p.getProduct().getId(),
                        "productName", p.getProduct().getName()
                ));
            }
            if (matchedPayments.size() >= 10) break;
        }

        Map<String, Object> results = new LinkedHashMap<>();
        results.put("query", query);
        results.put("tenants", matchedTenants);
        results.put("products", matchedProducts);
        results.put("customers", matchedCustomers);
        results.put("subscriptions", matchedSubscriptions);
        results.put("payments", matchedPayments);
        return results;
    }
}

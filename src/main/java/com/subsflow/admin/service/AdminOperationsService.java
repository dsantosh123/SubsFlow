package com.subsflow.admin.service;

import com.subsflow.billing.entity.CustomerPayment;
import com.subsflow.billing.repository.CustomerPaymentRepository;
import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.events.entity.WebhookDelivery;
import com.subsflow.events.repository.WebhookDeliveryRepository;
import com.subsflow.events.service.OutboundWebhookService;
import com.subsflow.plan.entity.ProductPlan;
import com.subsflow.plan.repository.ProductPlanRepository;
import com.subsflow.product.entity.Product;
import com.subsflow.product.repository.ProductRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.repository.TenantRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AdminOperationsService {

    private final TenantRepository tenantRepository;
    private final ProductRepository productRepository;
    private final ProductPlanRepository planRepository;
    private final CustomerRepository customerRepository;
    private final CustomerSubscriptionRepository subscriptionRepository;
    private final CustomerPaymentRepository paymentRepository;
    private final WebhookDeliveryRepository deliveryRepository;
    private final OutboundWebhookService webhookService;
    private final AdminAuditService auditService;

    public AdminOperationsService(TenantRepository tenantRepository,
                                  ProductRepository productRepository,
                                  ProductPlanRepository planRepository,
                                  CustomerRepository customerRepository,
                                  CustomerSubscriptionRepository subscriptionRepository,
                                  CustomerPaymentRepository paymentRepository,
                                  WebhookDeliveryRepository deliveryRepository,
                                  OutboundWebhookService webhookService,
                                  AdminAuditService auditService) {
        this.tenantRepository = tenantRepository;
        this.productRepository = productRepository;
        this.planRepository = planRepository;
        this.customerRepository = customerRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.deliveryRepository = deliveryRepository;
        this.webhookService = webhookService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTenantSupportOverview(String tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        List<Product> products = productRepository.findAllByTenantId(tenantId);
        List<Map<String, Object>> productDtos = new ArrayList<>();
        List<Map<String, Object>> planDtos = new ArrayList<>();
        List<Map<String, Object>> customerDtos = new ArrayList<>();
        List<Map<String, Object>> subDtos = new ArrayList<>();
        List<Map<String, Object>> payDtos = new ArrayList<>();

        for (Product p : products) {
            Map<String, Object> pm = new LinkedHashMap<>();
            pm.put("id", p.getId());
            pm.put("name", p.getName());
            pm.put("status", p.getStatus().name());
            pm.put("createdAt", p.getCreatedAt());
            productDtos.add(pm);

            for (ProductPlan plan : planRepository.findAllByProductIdOrderByDisplayOrderAscCreatedAtAsc(p.getId())) {
                Map<String, Object> plm = new LinkedHashMap<>();
                plm.put("id", plan.getId());
                plm.put("name", plan.getName());
                plm.put("price", plan.getPrice());
                plm.put("currency", plan.getCurrency());
                plm.put("interval", plan.getBillingInterval().name());
                plm.put("status", plan.getStatus().name());
                planDtos.add(plm);
            }

            for (Customer c : customerRepository.findAllByProductIdOrderByCreatedAtDesc(p.getId())) {
                if (customerDtos.size() < 20) {
                    Map<String, Object> cm = new LinkedHashMap<>();
                    cm.put("id", c.getId());
                    cm.put("name", c.getName());
                    cm.put("email", c.getEmail());
                    cm.put("status", c.getStatus().name());
                    cm.put("createdAt", c.getCreatedAt());
                    customerDtos.add(cm);
                }
            }

            for (CustomerSubscription s : subscriptionRepository.findAllByProductIdOrderByCreatedAtDesc(p.getId())) {
                if (subDtos.size() < 20) {
                    Map<String, Object> sm = new LinkedHashMap<>();
                    sm.put("id", s.getId());
                    sm.put("customerName", s.getCustomer() != null ? s.getCustomer().getName() : "—");
                    sm.put("planName", s.getPlan() != null ? s.getPlan().getName() : "—");
                    sm.put("price", s.getPriceAtSubscription());
                    sm.put("currency", s.getCurrencyAtSubscription());
                    sm.put("interval", s.getBillingIntervalAtSubscription());
                    sm.put("status", s.getStatus().name());
                    sm.put("createdAt", s.getCreatedAt());
                    subDtos.add(sm);
                }
            }

            for (CustomerPayment pay : paymentRepository.findAllByProductIdOrderByCreatedAtDesc(p.getId())) {
                if (payDtos.size() < 20) {
                    Map<String, Object> pym = new LinkedHashMap<>();
                    pym.put("id", pay.getId());
                    pym.put("amount", pay.getAmount());
                    pym.put("currency", pay.getCurrency());
                    pym.put("status", pay.getStatus().name());
                    pym.put("customerName", pay.getCustomer() != null ? pay.getCustomer().getName() : "—");
                    pym.put("paidAt", pay.getPaidAt());
                    pym.put("createdAt", pay.getCreatedAt());
                    payDtos.add(pym);
                }
            }
        }

        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("tenant", tenant);
        overview.put("productsCount", productDtos.size());
        overview.put("plansCount", planDtos.size());
        overview.put("customersCount", customerDtos.size());
        overview.put("subscriptionsCount", subDtos.size());
        overview.put("paymentsCount", payDtos.size());
        overview.put("products", productDtos);
        overview.put("plans", planDtos);
        overview.put("customers", customerDtos);
        overview.put("subscriptions", subDtos);
        overview.put("payments", payDtos);
        return overview;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAllProducts() {
        List<Product> products = productRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Map<String, Object>> result = new ArrayList<>();
        for (Product p : products) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("name", p.getName());
            m.put("status", p.getStatus().name());
            m.put("tenantId", p.getTenant().getId());
            m.put("tenantName", p.getTenant().getName());
            m.put("createdAt", p.getCreatedAt());
            result.add(m);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAllCustomers() {
        List<Customer> customers = customerRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Map<String, Object>> result = new ArrayList<>();
        for (Customer c : customers.stream().limit(100).toList()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getName());
            m.put("email", c.getEmail());
            m.put("status", c.getStatus().name());
            m.put("tenantId", c.getTenant().getId());
            m.put("tenantName", c.getTenant().getName());
            m.put("productId", c.getProduct().getId());
            m.put("productName", c.getProduct().getName());
            m.put("createdAt", c.getCreatedAt());
            result.add(m);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAllSubscriptions() {
        List<CustomerSubscription> subs = subscriptionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Map<String, Object>> result = new ArrayList<>();
        for (CustomerSubscription s : subs.stream().limit(100).toList()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("status", s.getStatus().name());
            m.put("customerName", s.getCustomer().getName());
            m.put("customerEmail", s.getCustomer().getEmail());
            m.put("planName", s.getPlan().getName());
            m.put("price", s.getPriceAtSubscription());
            m.put("currency", s.getCurrencyAtSubscription());
            m.put("interval", s.getBillingIntervalAtSubscription());
            m.put("tenantId", s.getTenant().getId());
            m.put("tenantName", s.getTenant().getName());
            m.put("productId", s.getProduct().getId());
            m.put("productName", s.getProduct().getName());
            m.put("createdAt", s.getCreatedAt());
            result.add(m);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAllPayments() {
        List<CustomerPayment> payments = paymentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Map<String, Object>> result = new ArrayList<>();
        for (CustomerPayment p : payments.stream().limit(100).toList()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("amount", p.getAmount());
            m.put("refundedAmount", p.getRefundedAmount());
            m.put("currency", p.getCurrency());
            m.put("status", p.getStatus().name());
            m.put("provider", p.getProvider());
            m.put("providerPaymentId", p.getProviderPaymentId());
            m.put("failureCode", p.getFailureCode());
            m.put("customerName", p.getCustomer().getName());
            m.put("tenantId", p.getTenant().getId());
            m.put("tenantName", p.getTenant().getName());
            m.put("productId", p.getProduct().getId());
            m.put("productName", p.getProduct().getName());
            m.put("paidAt", p.getPaidAt());
            m.put("createdAt", p.getCreatedAt());
            result.add(m);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<WebhookDelivery> listAllWebhookDeliveries() {
        return deliveryRepository.findAll(PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
    }

    @Transactional
    public WebhookDelivery retryWebhookDelivery(String deliveryId, String adminId, String adminEmail) {
        WebhookDelivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook delivery record not found"));

        WebhookDelivery retried = webhookService.retryDelivery(
                delivery.getTenant().getId(),
                "OWNER",
                delivery.getProduct().getId(),
                deliveryId
        );

        auditService.logAction(
                adminId,
                adminEmail,
                "RETRY_WEBHOOK_DELIVERY",
                deliveryId,
                "Triggered manual platform retry for webhook delivery to " + (delivery.getEndpoint() != null ? delivery.getEndpoint().getUrl() : "")
        );

        return retried;
    }
}

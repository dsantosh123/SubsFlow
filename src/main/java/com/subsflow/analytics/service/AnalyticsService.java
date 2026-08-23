package com.subsflow.analytics.service;

import com.subsflow.billing.entity.CustomerPayment;
import com.subsflow.billing.entity.PaymentStatus;
import com.subsflow.billing.repository.CustomerPaymentRepository;
import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerStatus;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.customer.entity.CustomerSubscriptionStatus;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.events.entity.CustomerUsageEvent;
import com.subsflow.events.repository.CustomerUsageEventRepository;
import com.subsflow.plan.entity.ProductPlan;
import com.subsflow.plan.repository.ProductPlanRepository;
import com.subsflow.product.entity.Product;
import com.subsflow.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final CustomerRepository customerRepository;
    private final CustomerSubscriptionRepository subscriptionRepository;
    private final ProductPlanRepository planRepository;
    private final CustomerPaymentRepository paymentRepository;
    private final CustomerUsageEventRepository usageRepository;
    private final ProductRepository productRepository;

    public AnalyticsService(CustomerRepository customerRepository,
                            CustomerSubscriptionRepository subscriptionRepository,
                            ProductPlanRepository planRepository,
                            CustomerPaymentRepository paymentRepository,
                            CustomerUsageEventRepository usageRepository,
                            ProductRepository productRepository) {
        this.customerRepository = customerRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.paymentRepository = paymentRepository;
        this.usageRepository = usageRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOverviewMetrics(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);

        List<Customer> customers = customerRepository.findAllByProductIdOrderByCreatedAtDesc(productId);
        List<CustomerSubscription> subscriptions = subscriptionRepository.findAllByProductIdOrderByCreatedAtDesc(productId);
        List<CustomerPayment> payments = paymentRepository.findAllByProductIdOrderByCreatedAtDesc(productId);

        long totalCustomers = customers.size();
        long activeCustomers = customers.stream().filter(c -> c.getStatus() == CustomerStatus.ACTIVE).count();

        long totalSubscriptions = subscriptions.size();
        long activeSubscriptions = subscriptions.stream().filter(s -> s.getStatus() == CustomerSubscriptionStatus.ACTIVE).count();
        long trialingSubscriptions = subscriptions.stream().filter(s -> s.getStatus() == CustomerSubscriptionStatus.TRIALING).count();
        long pausedSubscriptions = subscriptions.stream().filter(s -> s.getStatus() == CustomerSubscriptionStatus.PAUSED).count();
        long cancelledSubscriptions = subscriptions.stream().filter(s -> s.getStatus() == CustomerSubscriptionStatus.CANCELLED).count();

        BigDecimal mrr = calculateMRR(subscriptions);
        BigDecimal arr = mrr.multiply(BigDecimal.valueOf(12)).setScale(2, RoundingMode.HALF_UP);

        BigDecimal netRevenue = BigDecimal.ZERO;
        BigDecimal totalRefunded = BigDecimal.ZERO;
        long successfulPayments = 0;
        long failedPayments = 0;

        for (CustomerPayment p : payments) {
            if (p.getStatus() == PaymentStatus.SUCCEEDED || p.getStatus() == PaymentStatus.PARTIALLY_REFUNDED) {
                successfulPayments++;
                BigDecimal collected = p.getAmount().subtract(p.getRefundedAmount() != null ? p.getRefundedAmount() : BigDecimal.ZERO);
                netRevenue = netRevenue.add(collected);
            } else if (p.getStatus() == PaymentStatus.FAILED) {
                failedPayments++;
            }
            if (p.getRefundedAmount() != null) {
                totalRefunded = totalRefunded.add(p.getRefundedAmount());
            }
        }

        double churnRate = (activeSubscriptions + cancelledSubscriptions > 0)
                ? ((double) cancelledSubscriptions / (activeSubscriptions + cancelledSubscriptions)) * 100.0
                : 0.0;

        long activeWithTrial = subscriptions.stream()
                .filter(s -> s.getStatus() == CustomerSubscriptionStatus.ACTIVE && s.getTrialDays() > 0)
                .count();
        double trialConversionRate = (activeWithTrial + trialingSubscriptions > 0)
                ? ((double) activeWithTrial / (activeWithTrial + trialingSubscriptions)) * 100.0
                : 0.0;

        double paymentSuccessRate = (payments.size() > 0)
                ? ((double) successfulPayments / payments.size()) * 100.0
                : 100.0;

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("productId", productId);
        m.put("totalCustomers", totalCustomers);
        m.put("activeCustomers", activeCustomers);
        m.put("totalSubscriptions", totalSubscriptions);
        m.put("activeSubscriptions", activeSubscriptions);
        m.put("trialingSubscriptions", trialingSubscriptions);
        m.put("pausedSubscriptions", pausedSubscriptions);
        m.put("cancelledSubscriptions", cancelledSubscriptions);
        m.put("mrr", mrr);
        m.put("arr", arr);
        m.put("netRevenue", netRevenue.setScale(2, RoundingMode.HALF_UP));
        m.put("totalRefunded", totalRefunded.setScale(2, RoundingMode.HALF_UP));
        m.put("totalPaymentsCount", payments.size());
        m.put("successfulPayments", successfulPayments);
        m.put("failedPayments", failedPayments);
        m.put("churnRate", Math.round(churnRate * 10.0) / 10.0);
        m.put("trialConversionRate", Math.round(trialConversionRate * 10.0) / 10.0);
        m.put("paymentSuccessRate", Math.round(paymentSuccessRate * 10.0) / 10.0);
        return m;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRevenueMetrics(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);
        List<CustomerSubscription> subscriptions = subscriptionRepository.findAllByProductIdOrderByCreatedAtDesc(productId);
        List<CustomerPayment> payments = paymentRepository.findAllByProductIdOrderByCreatedAtDesc(productId);

        BigDecimal mrr = calculateMRR(subscriptions);
        BigDecimal arr = mrr.multiply(BigDecimal.valueOf(12)).setScale(2, RoundingMode.HALF_UP);

        BigDecimal grossCollected = BigDecimal.ZERO;
        BigDecimal refunded = BigDecimal.ZERO;

        for (CustomerPayment p : payments) {
            if (p.getStatus() == PaymentStatus.SUCCEEDED || p.getStatus() == PaymentStatus.PARTIALLY_REFUNDED || p.getStatus() == PaymentStatus.REFUNDED) {
                grossCollected = grossCollected.add(p.getAmount());
            }
            if (p.getRefundedAmount() != null) {
                refunded = refunded.add(p.getRefundedAmount());
            }
        }

        BigDecimal netRevenue = grossCollected.subtract(refunded).setScale(2, RoundingMode.HALF_UP);

        // MRR by Plan
        Map<String, BigDecimal> mrrByPlan = new LinkedHashMap<>();
        for (CustomerSubscription s : subscriptions) {
            if (s.getStatus() == CustomerSubscriptionStatus.ACTIVE) {
                String planName = s.getPlan().getName();
                BigDecimal subMrr = normalizeMonthlyPrice(s.getPriceAtSubscription(), s.getBillingIntervalAtSubscription());
                mrrByPlan.put(planName, mrrByPlan.getOrDefault(planName, BigDecimal.ZERO).add(subMrr));
            }
        }

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("mrr", mrr);
        m.put("arr", arr);
        m.put("grossCollected", grossCollected.setScale(2, RoundingMode.HALF_UP));
        m.put("totalRefunded", refunded.setScale(2, RoundingMode.HALF_UP));
        m.put("netRevenue", netRevenue);
        m.put("mrrByPlan", mrrByPlan);
        return m;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPlanPerformance(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);
        List<ProductPlan> plans = planRepository.findAllByProductIdOrderByDisplayOrderAscCreatedAtAsc(productId);
        List<CustomerSubscription> subs = subscriptionRepository.findAllByProductIdOrderByCreatedAtDesc(productId);

        List<Map<String, Object>> results = new ArrayList<>();

        for (ProductPlan plan : plans) {
            List<CustomerSubscription> planSubs = subs.stream()
                    .filter(s -> s.getPlan().getId().equals(plan.getId()))
                    .collect(Collectors.toList());

            long total = planSubs.size();
            long active = planSubs.stream().filter(s -> s.getStatus() == CustomerSubscriptionStatus.ACTIVE).count();
            long trialing = planSubs.stream().filter(s -> s.getStatus() == CustomerSubscriptionStatus.TRIALING).count();
            long cancelled = planSubs.stream().filter(s -> s.getStatus() == CustomerSubscriptionStatus.CANCELLED).count();

            BigDecimal planMrr = planSubs.stream()
                    .filter(s -> s.getStatus() == CustomerSubscriptionStatus.ACTIVE)
                    .map(s -> normalizeMonthlyPrice(s.getPriceAtSubscription(), s.getBillingIntervalAtSubscription()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            double churn = (active + cancelled > 0) ? ((double) cancelled / (active + cancelled)) * 100.0 : 0.0;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("planId", plan.getId());
            row.put("planName", plan.getName());
            row.put("price", plan.getPrice());
            row.put("currency", plan.getCurrency());
            row.put("billingInterval", plan.getBillingInterval().name());
            row.put("status", plan.getStatus().name());
            row.put("totalSubscribers", total);
            row.put("activeSubscribers", active);
            row.put("trialingSubscribers", trialing);
            row.put("cancelledSubscribers", cancelled);
            row.put("planMrr", planMrr);
            row.put("churnRate", Math.round(churn * 10.0) / 10.0);
            results.add(row);
        }

        return results;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentMetrics(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);
        List<CustomerPayment> payments = paymentRepository.findAllByProductIdOrderByCreatedAtDesc(productId);

        long total = payments.size();
        long succeeded = payments.stream().filter(p -> p.getStatus() == PaymentStatus.SUCCEEDED || p.getStatus() == PaymentStatus.PARTIALLY_REFUNDED).count();
        long failed = payments.stream().filter(p -> p.getStatus() == PaymentStatus.FAILED).count();
        long refunded = payments.stream().filter(p -> p.getStatus() == PaymentStatus.REFUNDED || p.getStatus() == PaymentStatus.PARTIALLY_REFUNDED).count();

        Map<String, Long> failureReasons = new LinkedHashMap<>();
        for (CustomerPayment p : payments) {
            if (p.getStatus() == PaymentStatus.FAILED && p.getFailureCode() != null) {
                failureReasons.put(p.getFailureCode(), failureReasons.getOrDefault(p.getFailureCode(), 0L) + 1);
            }
        }

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalPayments", total);
        m.put("succeededCount", succeeded);
        m.put("failedCount", failed);
        m.put("refundedCount", refunded);
        m.put("successRate", total > 0 ? Math.round(((double) succeeded / total) * 1000.0) / 10.0 : 100.0);
        m.put("failureRate", total > 0 ? Math.round(((double) failed / total) * 1000.0) / 10.0 : 0.0);
        m.put("failureReasons", failureReasons);
        return m;
    }

    // CSV Generation Methods
    @Transactional(readOnly = true)
    public String exportCustomersCsv(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);
        List<Customer> customers = customerRepository.findAllByProductIdOrderByCreatedAtDesc(productId);

        StringBuilder sb = new StringBuilder();
        sb.append("Customer ID,Name,Email,Status,Created At\n");
        for (Customer c : customers) {
            sb.append(escapeCsv(c.getId())).append(",")
                    .append(escapeCsv(c.getName())).append(",")
                    .append(escapeCsv(c.getEmail())).append(",")
                    .append(escapeCsv(c.getStatus().name())).append(",")
                    .append(escapeCsv(c.getCreatedAt().toString())).append("\n");
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String exportSubscriptionsCsv(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);
        List<CustomerSubscription> subs = subscriptionRepository.findAllByProductIdOrderByCreatedAtDesc(productId);

        StringBuilder sb = new StringBuilder();
        sb.append("Subscription ID,Customer Name,Customer Email,Plan Name,Status,Price,Currency,Billing Interval,Start Date,Current Period End\n");
        for (CustomerSubscription s : subs) {
            sb.append(escapeCsv(s.getId())).append(",")
                    .append(escapeCsv(s.getCustomer().getName())).append(",")
                    .append(escapeCsv(s.getCustomer().getEmail())).append(",")
                    .append(escapeCsv(s.getPlan().getName())).append(",")
                    .append(escapeCsv(s.getStatus().name())).append(",")
                    .append(s.getPriceAtSubscription()).append(",")
                    .append(escapeCsv(s.getCurrencyAtSubscription())).append(",")
                    .append(escapeCsv(s.getBillingIntervalAtSubscription())).append(",")
                    .append(escapeCsv(s.getStartDate().toString())).append(",")
                    .append(escapeCsv(s.getCurrentPeriodEnd().toString())).append("\n");
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String exportPaymentsCsv(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);
        List<CustomerPayment> payments = paymentRepository.findAllByProductIdOrderByCreatedAtDesc(productId);

        StringBuilder sb = new StringBuilder();
        sb.append("Payment ID,Customer Name,Amount,Refunded Amount,Currency,Status,Provider,Provider Payment ID,Paid At\n");
        for (CustomerPayment p : payments) {
            sb.append(escapeCsv(p.getId())).append(",")
                    .append(escapeCsv(p.getCustomer().getName())).append(",")
                    .append(p.getAmount()).append(",")
                    .append(p.getRefundedAmount() != null ? p.getRefundedAmount() : "0.00").append(",")
                    .append(escapeCsv(p.getCurrency())).append(",")
                    .append(escapeCsv(p.getStatus().name())).append(",")
                    .append(escapeCsv(p.getProvider())).append(",")
                    .append(escapeCsv(p.getProviderPaymentId() != null ? p.getProviderPaymentId() : "")).append(",")
                    .append(escapeCsv(p.getPaidAt() != null ? p.getPaidAt().toString() : "")).append("\n");
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String exportUsageCsv(String tenantId, String productId) {
        validateProductBelongsToTenant(tenantId, productId);
        List<CustomerUsageEvent> events = usageRepository.findAllByProductIdOrderByOccurredAtDesc(productId);

        StringBuilder sb = new StringBuilder();
        sb.append("Usage Event ID,Customer Name,Subscription ID,Feature Key,Quantity,Idempotency Key,Occurred At\n");
        for (CustomerUsageEvent e : events) {
            sb.append(escapeCsv(e.getId())).append(",")
                    .append(escapeCsv(e.getCustomer().getName())).append(",")
                    .append(escapeCsv(e.getSubscription().getId())).append(",")
                    .append(escapeCsv(e.getFeatureKey())).append(",")
                    .append(e.getQuantity()).append(",")
                    .append(escapeCsv(e.getIdempotencyKey() != null ? e.getIdempotencyKey() : "")).append(",")
                    .append(escapeCsv(e.getOccurredAt().toString())).append("\n");
        }
        return sb.toString();
    }

    public static BigDecimal calculateMRR(List<CustomerSubscription> subscriptions) {
        BigDecimal total = BigDecimal.ZERO;
        for (CustomerSubscription s : subscriptions) {
            if (s.getStatus() == CustomerSubscriptionStatus.ACTIVE) {
                total = total.add(normalizeMonthlyPrice(s.getPriceAtSubscription(), s.getBillingIntervalAtSubscription()));
            }
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal normalizeMonthlyPrice(BigDecimal price, String interval) {
        if (price == null) return BigDecimal.ZERO;
        if (interval == null) return price;

        switch (interval.toUpperCase()) {
            case "YEARLY":
                return price.divide(BigDecimal.valueOf(12), 4, RoundingMode.HALF_UP);
            case "WEEKLY":
                return price.multiply(BigDecimal.valueOf(4.33)).setScale(4, RoundingMode.HALF_UP);
            case "DAILY":
                return price.multiply(BigDecimal.valueOf(30)).setScale(4, RoundingMode.HALF_UP);
            case "MONTHLY":
            default:
                return price;
        }
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }

    private Product validateProductBelongsToTenant(String tenantId, String productId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));
    }
}

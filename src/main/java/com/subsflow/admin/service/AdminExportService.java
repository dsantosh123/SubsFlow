package com.subsflow.admin.service;

import com.subsflow.admin.entity.AdminAuditLog;
import com.subsflow.admin.repository.AdminAuditLogRepository;
import com.subsflow.billing.entity.CustomerPayment;
import com.subsflow.billing.repository.CustomerPaymentRepository;
import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerSubscription;
import com.subsflow.customer.repository.CustomerRepository;
import com.subsflow.customer.repository.CustomerSubscriptionRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.repository.TenantRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminExportService {

    private final TenantRepository tenantRepository;
    private final CustomerRepository customerRepository;
    private final CustomerSubscriptionRepository subscriptionRepository;
    private final CustomerPaymentRepository paymentRepository;
    private final AdminAuditLogRepository auditLogRepository;

    public AdminExportService(TenantRepository tenantRepository,
                              CustomerRepository customerRepository,
                              CustomerSubscriptionRepository subscriptionRepository,
                              CustomerPaymentRepository paymentRepository,
                              AdminAuditLogRepository auditLogRepository) {
        this.tenantRepository = tenantRepository;
        this.customerRepository = customerRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public String exportTenantsCsv() {
        List<Tenant> tenants = tenantRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        StringBuilder sb = new StringBuilder();
        sb.append("Tenant ID,Name,Status,Owner Name,Contact Email,Created At\n");
        for (Tenant t : tenants) {
            sb.append(escapeCsv(t.getId())).append(",")
                    .append(escapeCsv(t.getName())).append(",")
                    .append(escapeCsv(t.getStatus().name())).append(",")
                    .append(escapeCsv(t.getOwnerName() != null ? t.getOwnerName() : "")).append(",")
                    .append(escapeCsv(t.getContactEmail() != null ? t.getContactEmail() : "")).append(",")
                    .append(escapeCsv(t.getCreatedAt() != null ? t.getCreatedAt().toString() : "")).append("\n");
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String exportCustomersCsv() {
        List<Customer> customers = customerRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        StringBuilder sb = new StringBuilder();
        sb.append("Customer ID,Name,Email,Status,Tenant ID,Tenant Name,Product ID,Product Name,Created At\n");
        for (Customer c : customers) {
            sb.append(escapeCsv(c.getId())).append(",")
                    .append(escapeCsv(c.getName())).append(",")
                    .append(escapeCsv(c.getEmail())).append(",")
                    .append(escapeCsv(c.getStatus().name())).append(",")
                    .append(escapeCsv(c.getTenant().getId())).append(",")
                    .append(escapeCsv(c.getTenant().getName())).append(",")
                    .append(escapeCsv(c.getProduct().getId())).append(",")
                    .append(escapeCsv(c.getProduct().getName())).append(",")
                    .append(escapeCsv(c.getCreatedAt() != null ? c.getCreatedAt().toString() : "")).append("\n");
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String exportSubscriptionsCsv() {
        List<CustomerSubscription> subs = subscriptionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        StringBuilder sb = new StringBuilder();
        sb.append("Subscription ID,Customer Name,Customer Email,Plan Name,Status,Price,Currency,Interval,Tenant Name,Product Name,Created At\n");
        for (CustomerSubscription s : subs) {
            sb.append(escapeCsv(s.getId())).append(",")
                    .append(escapeCsv(s.getCustomer().getName())).append(",")
                    .append(escapeCsv(s.getCustomer().getEmail())).append(",")
                    .append(escapeCsv(s.getPlan().getName())).append(",")
                    .append(escapeCsv(s.getStatus().name())).append(",")
                    .append(s.getPriceAtSubscription()).append(",")
                    .append(escapeCsv(s.getCurrencyAtSubscription())).append(",")
                    .append(escapeCsv(s.getBillingIntervalAtSubscription())).append(",")
                    .append(escapeCsv(s.getTenant().getName())).append(",")
                    .append(escapeCsv(s.getProduct().getName())).append(",")
                    .append(escapeCsv(s.getCreatedAt() != null ? s.getCreatedAt().toString() : "")).append("\n");
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String exportPaymentsCsv() {
        List<CustomerPayment> payments = paymentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        StringBuilder sb = new StringBuilder();
        sb.append("Payment ID,Amount,Refunded Amount,Currency,Status,Provider,Provider Payment ID,Customer Name,Tenant Name,Product Name,Paid At\n");
        for (CustomerPayment p : payments) {
            sb.append(escapeCsv(p.getId())).append(",")
                    .append(p.getAmount()).append(",")
                    .append(p.getRefundedAmount() != null ? p.getRefundedAmount() : "0.00").append(",")
                    .append(escapeCsv(p.getCurrency())).append(",")
                    .append(escapeCsv(p.getStatus().name())).append(",")
                    .append(escapeCsv(p.getProvider())).append(",")
                    .append(escapeCsv(p.getProviderPaymentId() != null ? p.getProviderPaymentId() : "")).append(",")
                    .append(escapeCsv(p.getCustomer().getName())).append(",")
                    .append(escapeCsv(p.getTenant().getName())).append(",")
                    .append(escapeCsv(p.getProduct().getName())).append(",")
                    .append(escapeCsv(p.getPaidAt() != null ? p.getPaidAt().toString() : "")).append("\n");
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String exportAuditLogsCsv() {
        List<AdminAuditLog> logs = auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        StringBuilder sb = new StringBuilder();
        sb.append("Log ID,Admin ID,Admin Email,Action,Target ID,Details,Timestamp\n");
        for (AdminAuditLog l : logs) {
            sb.append(escapeCsv(l.getId())).append(",")
                    .append(escapeCsv(l.getAdminId())).append(",")
                    .append(escapeCsv(l.getAdminEmail())).append(",")
                    .append(escapeCsv(l.getAction())).append(",")
                    .append(escapeCsv(l.getTargetId())).append(",")
                    .append(escapeCsv(l.getDetails())).append(",")
                    .append(escapeCsv(l.getCreatedAt() != null ? l.getCreatedAt().toString() : "")).append("\n");
        }
        return sb.toString();
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}

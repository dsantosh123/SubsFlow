package com.subsflow.billing.scheduler;

import com.subsflow.billing.service.BillingCycleService;
import com.subsflow.common.context.TenantContext;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.repository.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@EnableScheduling
public class BillingCycleScheduler {

    private static final Logger log = LoggerFactory.getLogger(BillingCycleScheduler.class);

    private final TenantRepository tenantRepository;
    private final BillingCycleService billingCycleService;

    public BillingCycleScheduler(TenantRepository tenantRepository,
                                 BillingCycleService billingCycleService) {
        this.tenantRepository = tenantRepository;
        this.billingCycleService = billingCycleService;
    }

    @Scheduled(fixedDelay = 10000)
    public void runBillingCycle() {
        List<Tenant> tenants = tenantRepository.findAll();
        for (Tenant tenant : tenants) {
            try {
                TenantContext.setTenantId(tenant.getId());
                billingCycleService.billDueSubscriptions(tenant.getId());
            } catch (Exception e) {
                log.error("Error running billing cycle for tenant: {}", tenant.getId(), e);
            } finally {
                TenantContext.clear();
            }
        }
    }
}

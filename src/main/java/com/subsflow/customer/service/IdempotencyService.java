package com.subsflow.customer.service;

import com.subsflow.customer.entity.IdempotencyRecord;
import com.subsflow.customer.repository.IdempotencyRecordRepository;
import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class IdempotencyService {

    private final IdempotencyRecordRepository idempotencyRepository;
    private final TenantRepository tenantRepository;

    public IdempotencyService(IdempotencyRecordRepository idempotencyRepository,
                              TenantRepository tenantRepository) {
        this.idempotencyRepository = idempotencyRepository;
        this.tenantRepository = tenantRepository;
    }

    @Transactional(readOnly = true)
    public Optional<IdempotencyRecord> getExistingResponse(String tenantId, String idempotencyKey) {
        if (tenantId == null || idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            return Optional.empty();
        }
        return idempotencyRepository.findByTenantIdAndIdempotencyKey(tenantId, idempotencyKey.trim());
    }

    @Transactional
    public void recordResponse(String tenantId, String idempotencyKey, String operationType,
                               String resourceId, int status, String responseBody) {
        if (tenantId == null || idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            return;
        }

        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant == null) return;

        IdempotencyRecord record = new IdempotencyRecord();
        record.setId("idem_" + UUID.randomUUID().toString().substring(0, 8));
        record.setTenant(tenant);
        record.setIdempotencyKey(idempotencyKey.trim());
        record.setOperationType(operationType);
        record.setResourceId(resourceId);
        record.setResponseStatus(status);
        record.setResponseBody(responseBody);

        idempotencyRepository.save(record);
    }
}

package com.subsflow.payment.service;

import com.subsflow.common.context.TenantContext;
import com.subsflow.common.exception.IdempotencyConflictException;
import com.subsflow.common.exception.IdempotencyKeyUsedException;
import com.subsflow.payment.entity.IdempotencyKey;
import com.subsflow.payment.entity.IdempotencyKeyId;
import com.subsflow.payment.entity.IdempotencyKeyStatus;
import com.subsflow.payment.repository.IdempotencyKeyRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class IdempotencyServiceImpl implements IdempotencyService {

    private final IdempotencyKeyRepository idempotencyKeyRepository;

    public IdempotencyServiceImpl(IdempotencyKeyRepository idempotencyKeyRepository) {
        this.idempotencyKeyRepository = idempotencyKeyRepository;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void startOperation(String key, String requestHash) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException("Tenant context not found");
        }

        IdempotencyKey idempotency = new IdempotencyKey();
        idempotency.setKey(key);
        idempotency.setTenantId(tenantId);
        idempotency.setRequestHash(requestHash);
        idempotency.setStatus(IdempotencyKeyStatus.IN_PROGRESS);

        try {
            // Attempt to insert. If key exists, it will throw DataIntegrityViolationException.
            idempotencyKeyRepository.saveAndFlush(idempotency);
        } catch (DataIntegrityViolationException e) {
            // Unique constraint violation occurred. Look up existing record to determine status.
            IdempotencyKeyId id = new IdempotencyKeyId(tenantId, key);
            Optional<IdempotencyKey> existingOpt = idempotencyKeyRepository.findById(id);
            if (existingOpt.isPresent()) {
                IdempotencyKey existing = existingOpt.get();
                
                // If it exists but request hash differs, it's key misuse.
                if (!existing.getRequestHash().equals(requestHash)) {
                    throw new IdempotencyConflictException("Idempotency key was used with a different request payload");
                }
                
                if (existing.getStatus() == IdempotencyKeyStatus.IN_PROGRESS) {
                    throw new IdempotencyConflictException("Operation is already in progress");
                } else if (existing.getStatus() == IdempotencyKeyStatus.COMPLETED) {
                    throw new IdempotencyKeyUsedException("Operation already completed", existing.getResponsePayload());
                }
            }
            throw new IdempotencyConflictException("Duplicate request");
        }
    }

    @Override
    @Transactional
    public void completeOperation(String key, String responsePayload) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException("Tenant context not found");
        }

        IdempotencyKeyId id = new IdempotencyKeyId(tenantId, key);
        IdempotencyKey idempotency = idempotencyKeyRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Idempotency record not found for completion"));

        idempotency.setStatus(IdempotencyKeyStatus.COMPLETED);
        idempotency.setResponsePayload(responsePayload);
        idempotencyKeyRepository.save(idempotency);
    }
}

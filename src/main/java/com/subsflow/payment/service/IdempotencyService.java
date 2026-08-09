package com.subsflow.payment.service;

import com.subsflow.common.exception.IdempotencyConflictException;
import com.subsflow.common.exception.IdempotencyKeyUsedException;

public interface IdempotencyService {

    /**
     * Attempts to start an idempotent operation.
     * Inserts an idempotency key with status IN_PROGRESS.
     *
     * @param key         the idempotency key
     * @param requestHash the SHA-256 hash of the request payload
     * @throws IdempotencyConflictException if the key is already processing (status IN_PROGRESS).
     * @throws IdempotencyKeyUsedException if the key has completed (status COMPLETED, wraps cached response).
     */
    void startOperation(String key, String requestHash);

    /**
     * Completes the operation, saving the response payload.
     *
     * @param key             the idempotency key
     * @param responsePayload the response payload to cache
     */
    void completeOperation(String key, String responsePayload);
}

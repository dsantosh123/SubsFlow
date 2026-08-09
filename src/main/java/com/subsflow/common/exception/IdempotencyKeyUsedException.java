package com.subsflow.common.exception;

public class IdempotencyKeyUsedException extends RuntimeException {

    private final String responsePayload;

    public IdempotencyKeyUsedException(String message, String responsePayload) {
        super(message);
        this.responsePayload = responsePayload;
    }

    public String getResponsePayload() {
        return responsePayload;
    }
}

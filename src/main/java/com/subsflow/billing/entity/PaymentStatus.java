package com.subsflow.billing.entity;

public enum PaymentStatus {
    PENDING,
    SUCCEEDED,
    FAILED,
    REFUNDED,
    PARTIALLY_REFUNDED,
    CANCELLED
}

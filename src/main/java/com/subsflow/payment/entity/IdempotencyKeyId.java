package com.subsflow.payment.entity;

import java.io.Serializable;
import java.util.Objects;

public class IdempotencyKeyId implements Serializable {
    private String tenantId;
    private String key;

    public IdempotencyKeyId() {}

    public IdempotencyKeyId(String tenantId, String key) {
        this.tenantId = tenantId;
        this.key = key;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        IdempotencyKeyId that = (IdempotencyKeyId) o;
        return Objects.equals(tenantId, that.tenantId) && Objects.equals(key, that.key);
    }

    @Override
    public int hashCode() {
        return Objects.hash(tenantId, key);
    }
}

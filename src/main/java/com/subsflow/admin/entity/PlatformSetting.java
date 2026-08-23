package com.subsflow.admin.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "platform_setting")
@Getter
@Setter
@NoArgsConstructor
public class PlatformSetting {

    @Id
    private String key;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String value;

    private String description;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public PlatformSetting(String key, String value, String description) {
        this.key = key;
        this.value = value;
        this.description = description;
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    @PrePersist
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}

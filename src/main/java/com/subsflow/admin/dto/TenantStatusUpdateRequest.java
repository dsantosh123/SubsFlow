package com.subsflow.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TenantStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    private String status;
}

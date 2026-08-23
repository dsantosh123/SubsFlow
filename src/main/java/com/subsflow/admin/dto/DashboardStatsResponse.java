package com.subsflow.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalTenants;
    private long activeTenants;
    private long suspendedTenants;
    private long newTenants;
}

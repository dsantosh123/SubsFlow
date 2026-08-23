package com.subsflow.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AdminLoginResponse {
    private String token;
    private String tokenType;
    private long expiresInMs;
    private String adminId;
    private String email;
    private String name;
}

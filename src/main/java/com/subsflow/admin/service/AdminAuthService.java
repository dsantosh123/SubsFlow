package com.subsflow.admin.service;

import com.subsflow.admin.entity.PlatformAdmin;
import com.subsflow.admin.repository.PlatformAdminRepository;
import com.subsflow.common.security.JwtService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AdminAuthService {

    private final PlatformAdminRepository adminRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminAuthService(PlatformAdminRepository adminRepository, JwtService jwtService) {
        this.adminRepository = adminRepository;
        this.jwtService = jwtService;
    }

    public Optional<String> login(String email, String password) {
        if (email == null || password == null) {
            return Optional.empty();
        }

        return adminRepository.findByEmail(email.trim().toLowerCase())
                .filter(admin -> passwordEncoder.matches(password, admin.getPasswordHash()))
                .map(jwtService::generateAdminToken);
    }

    public Optional<PlatformAdmin> findByEmail(String email) {
        if (email == null) {
            return Optional.empty();
        }
        return adminRepository.findByEmail(email.trim().toLowerCase());
    }
}

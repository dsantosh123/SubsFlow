package com.subsflow.admin.service;

import com.subsflow.admin.entity.PlatformAdmin;
import com.subsflow.admin.repository.PlatformAdminRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AdminManagementService {

    private final PlatformAdminRepository adminRepository;
    private final AdminAuditService auditService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminManagementService(PlatformAdminRepository adminRepository,
                                  AdminAuditService auditService) {
        this.adminRepository = adminRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAdmins() {
        List<PlatformAdmin> admins = adminRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (PlatformAdmin a : admins) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("email", a.getEmail());
            m.put("name", a.getName());
            m.put("role", a.getRole());
            m.put("status", a.getStatus() != null ? a.getStatus() : "ACTIVE");
            m.put("createdAt", a.getCreatedAt());
            m.put("updatedAt", a.getUpdatedAt());
            result.add(m);
        }
        return result;
    }

    @Transactional
    public PlatformAdmin createAdmin(String name, String email, String password, String role,
                                     String actorAdminId, String actorEmail) {
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Valid email address is required");
        }
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        if (adminRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("An admin with email " + email + " already exists");
        }

        String assignedRole = (role != null && !role.isBlank()) ? role : "PLATFORM_ADMIN";

        PlatformAdmin admin = new PlatformAdmin();
        admin.setId("admin_" + UUID.randomUUID().toString().substring(0, 8));
        admin.setName(name != null ? name.trim() : "Internal Admin");
        admin.setEmail(email.trim().toLowerCase());
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(assignedRole);
        admin.setStatus("ACTIVE");

        PlatformAdmin saved = adminRepository.save(admin);

        auditService.logAction(
                actorAdminId,
                actorEmail,
                "CREATE_PLATFORM_ADMIN",
                saved.getId(),
                "Created new internal admin user: " + saved.getEmail() + " with role " + assignedRole
        );

        return saved;
    }

    @Transactional
    public PlatformAdmin updateStatus(String adminId, String newStatus, String actorAdminId, String actorEmail) {
        PlatformAdmin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));

        if (admin.getId().equals(actorAdminId)) {
            throw new IllegalArgumentException("You cannot modify your own active admin status");
        }

        String validStatus = "ACTIVE".equalsIgnoreCase(newStatus) ? "ACTIVE" : "DISABLED";
        admin.setStatus(validStatus);
        PlatformAdmin saved = adminRepository.save(admin);

        auditService.logAction(
                actorAdminId,
                actorEmail,
                "UPDATE_ADMIN_STATUS",
                admin.getId(),
                "Changed status of admin " + admin.getEmail() + " to " + validStatus
        );

        return saved;
    }

    @Transactional
    public PlatformAdmin updateRole(String adminId, String newRole, String actorAdminId, String actorEmail) {
        PlatformAdmin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));

        admin.setRole(newRole);
        PlatformAdmin saved = adminRepository.save(admin);

        auditService.logAction(
                actorAdminId,
                actorEmail,
                "UPDATE_ADMIN_ROLE",
                admin.getId(),
                "Changed role of admin " + admin.getEmail() + " to " + newRole
        );

        return saved;
    }

    @Transactional
    public void resetPassword(String adminId, String newPassword, String actorAdminId, String actorEmail) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        PlatformAdmin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));

        admin.setPasswordHash(passwordEncoder.encode(newPassword));
        adminRepository.save(admin);

        auditService.logAction(
                actorAdminId,
                actorEmail,
                "RESET_ADMIN_PASSWORD",
                admin.getId(),
                "Reset credentials for admin: " + admin.getEmail()
        );
    }
}

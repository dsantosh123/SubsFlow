package com.subsflow.tenant.service;

import com.subsflow.tenant.entity.Tenant;
import com.subsflow.tenant.entity.TenantStatus;
import com.subsflow.tenant.entity.TenantUser;
import com.subsflow.tenant.entity.TenantRole;
import com.subsflow.tenant.repository.TenantRepository;
import com.subsflow.tenant.repository.TenantUserRepository;
import com.subsflow.common.security.JwtService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TenantAuthService {

    private final TenantRepository tenantRepository;
    private final TenantUserRepository tenantUserRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public TenantAuthService(TenantRepository tenantRepository,
                             TenantUserRepository tenantUserRepository,
                             JwtService jwtService) {
        this.tenantRepository = tenantRepository;
        this.tenantUserRepository = tenantUserRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public TenantUser registerTenant(String companyName, String ownerName, String ownerEmail, String password) {
        if (companyName == null || companyName.trim().isEmpty()) {
            throw new IllegalArgumentException("Company name is required");
        }
        if (ownerName == null || ownerName.trim().isEmpty()) {
            throw new IllegalArgumentException("Owner name is required");
        }
        if (ownerEmail == null || ownerEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Owner email is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        String cleanedEmail = ownerEmail.trim().toLowerCase();

        if (tenantUserRepository.findByEmail(cleanedEmail).isPresent()) {
            throw new IllegalArgumentException("Email is already registered. Please log in.");
        }

        // 1. Create Tenant
        Tenant tenant = new Tenant();
        tenant.setId("t_" + UUID.randomUUID().toString().substring(0, 8));
        tenant.setName(companyName.trim());
        tenant.setStatus(TenantStatus.ACTIVE);
        tenant.setApiKey("sk_" + UUID.randomUUID().toString().replace("-", ""));
        tenant.setOwnerName(ownerName.trim());
        tenant.setContactEmail(cleanedEmail);
        tenant = tenantRepository.save(tenant);

        // 2. Create Owner User
        TenantUser user = new TenantUser();
        user.setId("tu_" + UUID.randomUUID().toString().substring(0, 8));
        user.setTenant(tenant);
        user.setEmail(cleanedEmail);
        user.setName(ownerName.trim());
        user.setRole(TenantRole.OWNER);
        user.setPasswordHash(passwordEncoder.encode(password));
        return tenantUserRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Optional<TenantUser> login(String email, String password) {
        if (email == null || password == null) {
            return Optional.empty();
        }
        return tenantUserRepository.findByEmail(email.trim().toLowerCase())
                .filter(user -> passwordEncoder.matches(password, user.getPasswordHash()));
    }

    @Transactional
    public TenantUser inviteTeamMember(String callerTenantId, String callerRoleStr, String name, String email, String password, String roleStr) {
        if (callerTenantId == null) {
            throw new IllegalArgumentException("Tenant context required");
        }
        TenantRole callerRole = TenantRole.valueOf(callerRoleStr.toUpperCase());
        TenantRole targetRole;
        try {
            targetRole = TenantRole.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            targetRole = TenantRole.DEVELOPER;
        }

        if (callerRole != TenantRole.OWNER && callerRole != TenantRole.ADMIN) {
            throw new IllegalStateException(callerRole + " cannot invite users");
        }
        if (callerRole == TenantRole.ADMIN && (targetRole == TenantRole.ADMIN || targetRole == TenantRole.OWNER)) {
            throw new IllegalStateException("ADMIN can only invite DEVELOPER, EDITOR, or VIEWER users");
        }
        if (targetRole == TenantRole.OWNER) {
            throw new IllegalArgumentException("Cannot invite another OWNER");
        }

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.trim().isEmpty()) {
            password = "Temp_User_2026!"; // default password if not provided
        }

        String cleanedEmail = email.trim().toLowerCase();

        if (tenantUserRepository.existsByTenantIdAndEmail(callerTenantId, cleanedEmail)) {
            throw new IllegalArgumentException("A user with this email already exists in this tenant");
        }
        if (tenantUserRepository.findByEmail(cleanedEmail).isPresent()) {
            throw new IllegalArgumentException("Email is already registered in SubsFlow");
        }

        Tenant tenant = tenantRepository.findById(callerTenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        TenantUser user = new TenantUser();
        user.setId("tu_" + UUID.randomUUID().toString().substring(0, 8));
        user.setTenant(tenant);
        user.setEmail(cleanedEmail);
        user.setName(name.trim());
        user.setRole(targetRole);
        user.setPasswordHash(passwordEncoder.encode(password));
        return tenantUserRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<TenantUser> listTeamMembers(String tenantId) {
        return tenantUserRepository.findAllByTenantId(tenantId);
    }
}

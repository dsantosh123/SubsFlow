package com.subsflow.admin.repository;

import com.subsflow.admin.entity.PlatformAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PlatformAdminRepository extends JpaRepository<PlatformAdmin, String> {
    Optional<PlatformAdmin> findByEmail(String email);
}

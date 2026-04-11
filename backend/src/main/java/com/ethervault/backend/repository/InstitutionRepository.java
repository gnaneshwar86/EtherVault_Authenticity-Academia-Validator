package com.ethervault.backend.repository;

import com.ethervault.backend.model.Institution;
import com.ethervault.backend.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InstitutionRepository extends JpaRepository<Institution, UUID> {
    Optional<Institution> findByEmail(String email);
    Optional<Institution> findByWalletAddress(String walletAddress);
    List<Institution> findByRole(UserRole role);
}

package com.ethervault.backend.repository;

import com.ethervault.backend.model.VerificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VerificationLogRepository extends JpaRepository<VerificationLog, UUID> {
    List<VerificationLog> findByVerifierName(String verifierName);
}

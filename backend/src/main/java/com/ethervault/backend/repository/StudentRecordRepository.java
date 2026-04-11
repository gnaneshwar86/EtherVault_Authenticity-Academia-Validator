package com.ethervault.backend.repository;

import com.ethervault.backend.model.StudentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StudentRecordRepository extends JpaRepository<StudentRecord, UUID> {
    List<StudentRecord> findByInstitutionId(UUID institutionId);
    java.util.Optional<StudentRecord> findByRegisterNumber(String registerNumber);
}

package com.ethervault.backend.controller;

import com.ethervault.backend.model.Institution;
import com.ethervault.backend.model.StudentRecord;
import com.ethervault.backend.model.UserRole;
import com.ethervault.backend.model.VerificationLog;
import com.ethervault.backend.repository.InstitutionRepository;
import com.ethervault.backend.repository.StudentRecordRepository;
import com.ethervault.backend.repository.VerificationLogRepository;
import com.ethervault.backend.service.BlockchainService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final InstitutionRepository institutionRepository;
    private final StudentRecordRepository studentRecordRepository;
    private final VerificationLogRepository verificationLogRepository;
    private final BlockchainService blockchainService;

    /** GET /api/admin/institutions — list all registered institutions (ROLE_INSTITUTION only) */
    @GetMapping("/institutions")
    public ResponseEntity<List<Institution>> getAllInstitutions() {
        List<Institution> list = institutionRepository.findByRole(UserRole.ROLE_INSTITUTION);
        System.out.println("ADMIN API: Found " + list.size() + " institutions in database.");
        return ResponseEntity.ok(list);
    }

    /** GET /api/admin/verifications — all verification logs */
    @GetMapping("/verifications")
    public ResponseEntity<Iterable<VerificationLog>> getAllLogs() {
        return ResponseEntity.ok(verificationLogRepository.findAll());
    }

    /** GET /api/admin/records — all student records across all institutions */
    @GetMapping("/records")
    public ResponseEntity<List<StudentRecord>> getAllRecords() {
        return ResponseEntity.ok(studentRecordRepository.findAll());
    }

    /**
     * POST /api/admin/authorize-institution
     * Body: { "institutionId": "uuid" }
     * Calls EtherVault smart contract authorizeInstitution(walletAddress)
     */
    @PostMapping("/authorize-institution")
    public ResponseEntity<?> authorizeInstitution(@RequestBody Map<String, String> body) {
        String institutionId = body.get("institutionId");
        try {
            @SuppressWarnings("null")
            UUID uuid = java.util.UUID.fromString(institutionId);
            Institution inst = institutionRepository.findById(uuid)
                    .orElseThrow(() -> new RuntimeException("Institution not found"));

            if (inst.getWalletAddress() == null || inst.getWalletAddress().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Institution has no wallet address configured"));
            }

            String txHash = blockchainService.authorizeInstitution(inst.getWalletAddress());
            inst.setAuthorized(true);
            institutionRepository.save(inst);

            return ResponseEntity.ok(Map.of(
                    "message", "Institution authorized on blockchain",
                    "institution", inst.getName(),
                    "walletAddress", inst.getWalletAddress(),
                    "txHash", txHash
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/revoke-institution
     * Body: { "institutionId": "uuid" }
     * Calls EtherVault smart contract revokeInstitution(walletAddress)
     */
    @PostMapping("/revoke-institution")
    public ResponseEntity<?> revokeInstitution(@RequestBody Map<String, String> body) {
        String institutionId = body.get("institutionId");
        try {
            @SuppressWarnings("null")
            UUID uuid = java.util.UUID.fromString(institutionId);
            Institution inst = institutionRepository.findById(uuid)
                    .orElseThrow(() -> new RuntimeException("Institution not found"));

            if (inst.getWalletAddress() == null || inst.getWalletAddress().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Institution has no wallet address configured"));
            }

            String txHash = blockchainService.revokeInstitution(inst.getWalletAddress());
            inst.setAuthorized(false);
            institutionRepository.save(inst);

            return ResponseEntity.ok(Map.of(
                    "message", "Institution revoked on blockchain",
                    "institution", inst.getName(),
                    "walletAddress", inst.getWalletAddress(),
                    "txHash", txHash
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/admin/stats — summary counts */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long institutionCount = institutionRepository.findByRole(UserRole.ROLE_INSTITUTION).size();
        long recordCount      = studentRecordRepository.count();
        long logCount         = verificationLogRepository.count();

        return ResponseEntity.ok(Map.of(
                "institutions", institutionCount,
                "records",      recordCount,
                "verifications", logCount
        ));
    }
}

package com.ethervault.backend.controller;

import com.ethervault.backend.model.Institution;
import com.ethervault.backend.model.StudentRecord;
import com.ethervault.backend.repository.InstitutionRepository;
import com.ethervault.backend.service.InstitutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/institution")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InstitutionController {

    private final InstitutionService institutionService;
    private final InstitutionRepository institutionRepository;

    /** Get the currently authenticated institution from JWT */
    private Institution getCurrentInstitution() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return institutionRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Institution not found for email: " + email));
    }

    /**
     * Upload a student record for the authenticated institution.
     * POST /api/institution/upload-record
     */
    @PostMapping("/upload-record")
    public ResponseEntity<?> uploadRecord(
            @RequestParam String studentName,
            @RequestParam String degreeName,
            @RequestParam String branch,
            @RequestParam String universityName,
            @RequestParam String registerNumber,
            @RequestParam String yearOfPassing,
            @RequestParam String certificateNumber,
            @RequestParam String dateOfIssue,
            @RequestParam(required = false) org.springframework.web.multipart.MultipartFile document) {
        try {
            Institution inst = getCurrentInstitution();
            StudentRecord record = institutionService.uploadRecord(
                    inst.getId(), studentName, degreeName, branch,
                    universityName, registerNumber, yearOfPassing,
                    certificateNumber, dateOfIssue, document);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Fetch all records for the authenticated institution.
     * GET /api/institution/records
     */
    @GetMapping("/records")
    public ResponseEntity<List<StudentRecord>> getRecords() {
        Institution inst = getCurrentInstitution();
        return ResponseEntity.ok(institutionService.getRecords(inst.getId()));
    }

    /**
     * Get the authenticated institution's own profile.
     * GET /api/institution/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        Institution inst = getCurrentInstitution();
        return ResponseEntity.ok(Map.of(
                "id", inst.getId(),
                "name", inst.getName(),
                "email", inst.getEmail(),
                "walletAddress", inst.getWalletAddress() != null ? inst.getWalletAddress() : "",
                "role", inst.getRole().name(),
                "authorized", inst.isAuthorized(),
                "createdAt", inst.getCreatedAt()
        ));
    }

    /**
     * Delete a student record by ID.
     * DELETE /api/institution/records/{id}
     */
    @DeleteMapping("/records/{id}")
    public ResponseEntity<?> deleteRecord(@PathVariable("id") String id) {
        try {
            java.util.UUID recordId = java.util.UUID.fromString(id);
            Institution inst = getCurrentInstitution();
            System.out.println("Institution " + inst.getEmail() + " requesting delete for record " + id);
            institutionService.deleteRecord(recordId, inst.getId());
            return ResponseEntity.ok(Map.of("message", "Record deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

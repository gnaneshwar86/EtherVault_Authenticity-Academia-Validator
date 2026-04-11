package com.ethervault.backend.service;

import com.ethervault.backend.model.VerificationLog;
import com.ethervault.backend.repository.VerificationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.ethervault.backend.repository.StudentRecordRepository;
import com.ethervault.backend.model.StudentRecord;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VerificationService {
    private final NormalizationService normalizationService;
    private final BlockchainService blockchainService;
    private final VerificationLogRepository verificationLogRepository;
    private final AiExtractionService aiExtractionService;
    private final StudentRecordRepository studentRecordRepository;

    public Map<String, Object> verifyCertificateDocument(MultipartFile document, String verifierName) throws Exception {
        Map<String, String> extractedData = aiExtractionService.extractCertificateData(document);
        extractedData.put("verifierName", verifierName);
        return verifyCertificateData(extractedData);
    }

    public Map<String, Object> verifyCertificateData(Map<String, String> data) throws Exception {
        String verifierName = data.getOrDefault("verifierName", "Anonymous Platform Verifier");

        // Extract the 8 fields
        String studentName = data.getOrDefault("studentName", "");
        String degreeName = data.getOrDefault("degreeName", "");
        String branch = data.getOrDefault("branch", "");
        String universityName = data.getOrDefault("universityName", "");
        String registerNumber = data.getOrDefault("registerNumber", "");
        String yearOfPassing = data.getOrDefault("yearOfPassing", "");
        String certificateNumber = data.getOrDefault("certificateNumber", "");
        String dateOfIssue = data.getOrDefault("dateOfIssue", "");

        // 1. Normalize and Hash using all 8 fields
        String canonical = normalizationService.normalize(
                studentName, degreeName, branch, universityName,
                registerNumber, yearOfPassing, certificateNumber, dateOfIssue);
        String generatedHash = normalizationService.generateHash(canonical);

        // 2. Verify against Blockchain
        boolean isAuthentic = blockchainService.verifyHashOnBlockchain(generatedHash);
        String status = isAuthentic ? "AUTHENTIC" : "NOT_FOUND_OR_TAMPERED";

        // 3. Log the verification attempt
        VerificationLog log = VerificationLog.builder()
                .certificateId(registerNumber)
                .verificationStatus(status)
                .verifierName(verifierName)
                .timestamp(LocalDateTime.now())
                .build();
        verificationLogRepository.save(log);

        Map<String, String> extractedData = new LinkedHashMap<>();
        extractedData.put("studentName", studentName);
        extractedData.put("degreeName", degreeName);
        extractedData.put("branch", branch);
        extractedData.put("universityName", universityName);
        extractedData.put("registerNumber", registerNumber);
        extractedData.put("yearOfPassing", yearOfPassing);
        extractedData.put("certificateNumber", certificateNumber);
        extractedData.put("dateOfIssue", dateOfIssue);

        String ipfsCid = null;
        String txHash = null;
        if (isAuthentic && !registerNumber.isEmpty()) {
            Optional<StudentRecord> rec = studentRecordRepository.findByRegisterNumber(registerNumber);
            if (rec.isPresent()) {
                ipfsCid = rec.get().getIpfsCid();
                txHash = rec.get().getBlockchainTxHash();
            }
        }

        Map<String, Object> responseMap = new LinkedHashMap<>();
        responseMap.put("isAuthentic", isAuthentic);
        responseMap.put("status", status);
        responseMap.put("extractedData", extractedData);
        responseMap.put("blockchainHash", generatedHash);
        if (txHash != null) {
            responseMap.put("blockchainTxHash", txHash);
        }
        responseMap.put("timestamp", LocalDateTime.now().toString());
        if (ipfsCid != null) {
            responseMap.put("ipfsCid", ipfsCid);
        }
        if (data.containsKey("rawText")) {
            responseMap.put("rawText", data.get("rawText"));
        }

        return responseMap;
    }

    public Iterable<VerificationLog> getLogs() {
        return verificationLogRepository.findAll();
    }

    public Iterable<VerificationLog> getLogsByVerifier(String verifierName) {
        return verificationLogRepository.findByVerifierName(verifierName);
    }
}

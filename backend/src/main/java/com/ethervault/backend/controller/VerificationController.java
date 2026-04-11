package com.ethervault.backend.controller;

import com.ethervault.backend.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/verify")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VerificationController {
    private final VerificationService verificationService;

    @PostMapping("/data")
    public ResponseEntity<Map<String, Object>> verifyData(@RequestBody Map<String, String> data) {
        try {
            Map<String, Object> result = verificationService.verifyCertificateData(data);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/extract")
    public ResponseEntity<Map<String, Object>> extractAndVerify(@RequestParam("certificate") org.springframework.web.multipart.MultipartFile certificate, @RequestParam("verifierName") String verifierName) {
        try {
            Map<String, Object> result = verificationService.verifyCertificateDocument(certificate, verifierName);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/logs")
    public ResponseEntity<Iterable<?>> getLogs() {
        return ResponseEntity.ok(verificationService.getLogs());
    }

    @GetMapping("/my-history")
    public ResponseEntity<Iterable<?>> getMyHistory(@RequestParam String verifierName) {
        return ResponseEntity.ok(verificationService.getLogsByVerifier(verifierName));
    }
}

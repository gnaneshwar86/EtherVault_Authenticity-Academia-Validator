package com.ethervault.backend.controller;

import com.ethervault.backend.dto.AuthResponse;
import com.ethervault.backend.dto.LoginRequest;
import com.ethervault.backend.dto.RegisterRequest;
import com.ethervault.backend.model.Institution;
import com.ethervault.backend.model.UserRole;
import com.ethervault.backend.repository.InstitutionRepository;
import com.ethervault.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final InstitutionRepository institutionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    /**
     * Unified login for all roles (ADMIN, INSTITUTION, VERIFIER).
     * POST /api/auth/login  { "email": "...", "password": "..." }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        Institution user = institutionRepository.findByEmail(req.getEmail())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return ResponseEntity.ok(new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.isAuthorized()
        ));
    }

    /**
     * Register an Institution.
     * POST /api/auth/register-institution
     */
    @PostMapping("/register-institution")
    public ResponseEntity<?> registerInstitution(@RequestBody RegisterRequest req) {
        if (institutionRepository.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already registered"));
        }

        Institution inst = Institution.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .walletAddress(req.getWalletAddress())
                .role(UserRole.ROLE_INSTITUTION)
                .build();

        @SuppressWarnings("null")
        Institution saved = institutionRepository.save(inst);
        String token = jwtUtils.generateToken(saved.getEmail(), saved.getRole().name());

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                token,
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole().name(),
                saved.isAuthorized()
        ));
    }

    /**
     * Register a Verifier (same table, different role).
     * POST /api/auth/register-verifier
     */
    @PostMapping("/register-verifier")
    public ResponseEntity<?> registerVerifier(@RequestBody RegisterRequest req) {
        if (institutionRepository.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already registered"));
        }

        Institution verifier = Institution.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .walletAddress(req.getWalletAddress())
                .role(UserRole.ROLE_VERIFIER)
                .build();

        @SuppressWarnings("null")
        Institution saved = institutionRepository.save(verifier);
        String token = jwtUtils.generateToken(saved.getEmail(), saved.getRole().name());

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                token,
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole().name(),
                saved.isAuthorized()
        ));
    }

    /**
     * Seed an admin account from the backend (not exposed in UI).
     * POST /api/auth/seed-admin  { "email":"...", "password":"..." }
     * This is protected — only runs successfully if no admin already exists.
     */
    @PostMapping("/seed-admin")
    public ResponseEntity<?> seedAdmin(@RequestBody LoginRequest req) {
        boolean adminExists = institutionRepository.findByRole(UserRole.ROLE_ADMIN)
                .stream().anyMatch(i -> i.getEmail().equals(req.getEmail()));
        if (adminExists) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Admin already exists"));
        }

        Institution admin = Institution.builder()
                .name("System Administrator")
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(UserRole.ROLE_ADMIN)
                .build();

        institutionRepository.save(admin);
        return ResponseEntity.ok(Map.of("message", "Admin account created. Login to get your token."));
    }
}

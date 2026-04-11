package com.ethervault.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentRecord {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @Column(name = "student_name", nullable = false)
    private String studentName;

    @Column(name = "degree_name", nullable = false)
    private String degreeName;

    @Column(name = "branch", nullable = false)
    private String branch;

    @Column(name = "university_name", nullable = false)
    private String universityName;

    @Column(name = "register_number", nullable = false, unique = true)
    private String registerNumber;

    @Column(name = "year_of_passing", nullable = false)
    private String yearOfPassing;

    @Column(name = "certificate_number", nullable = false, unique = true)
    private String certificateNumber;

    @Column(name = "date_of_issue", nullable = false)
    private String dateOfIssue;

    @Column(name = "canonical_string", columnDefinition = "TEXT")
    private String canonicalString;

    @Column(name = "data_hash")
    private String dataHash;

    @Column(name = "blockchain_tx_hash")
    private String blockchainTxHash;

    @Column(name = "ipfs_cid")
    private String ipfsCid;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

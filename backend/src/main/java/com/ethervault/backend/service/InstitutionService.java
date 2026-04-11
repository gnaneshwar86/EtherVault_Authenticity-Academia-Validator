package com.ethervault.backend.service;

import com.ethervault.backend.model.Institution;
import com.ethervault.backend.model.StudentRecord;
import com.ethervault.backend.repository.InstitutionRepository;
import com.ethervault.backend.repository.StudentRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InstitutionService {
    private final InstitutionRepository institutionRepository;
    private final StudentRecordRepository studentRecordRepository;
    private final NormalizationService normalizationService;
    private final BlockchainService blockchainService;
    private final PasswordEncoder passwordEncoder;
    private final IpfsService ipfsService;

    public Institution register(String name, String email, String password, String walletAddress) {
        Institution institution = Institution.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .walletAddress(walletAddress)
                .build();
        return institutionRepository.save(institution);
    }

    @Transactional
    public StudentRecord uploadRecord(UUID institutionId,
                                       String studentName, String degreeName, String branch,
                                       String universityName, String registerNumber,
                                       String yearOfPassing, String certificateNumber,
                                       String dateOfIssue, MultipartFile document) throws Exception {

        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new RuntimeException("Institution not found"));

        if (!institution.isAuthorized()) {
            throw new RuntimeException("Administrative authorization required to anchor records to the blockchain.");
        }

        String canonical = normalizationService.normalize(
                studentName, degreeName, branch, universityName,
                registerNumber, yearOfPassing, certificateNumber, dateOfIssue);
        String hash = normalizationService.generateHash(canonical);

        // Upload physical document to IPFS
        String ipfsCid = null;
        if (document != null && !document.isEmpty()) {
            ipfsCid = ipfsService.uploadToIpfs(document);
        }

        // Store hash on blockchain
        String txHash = blockchainService.storeHashOnBlockchain(hash);

        StudentRecord record = StudentRecord.builder()
                .institution(institution)
                .studentName(studentName)
                .degreeName(degreeName)
                .branch(branch)
                .universityName(universityName)
                .registerNumber(registerNumber)
                .yearOfPassing(yearOfPassing)
                .certificateNumber(certificateNumber)
                .dateOfIssue(dateOfIssue)
                .dataHash(hash)
                .blockchainTxHash(txHash)
                .ipfsCid(ipfsCid)
                .build();

        return studentRecordRepository.save(record);
    }

    public List<StudentRecord> getRecords(UUID institutionId) {
        return studentRecordRepository.findByInstitutionId(institutionId);
    }

    @Transactional
    public void deleteRecord(UUID recordId, UUID institutionId) {
        StudentRecord record = studentRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Record not found"));
        
        if (!record.getInstitution().getId().toString().equals(institutionId.toString())) {
            throw new RuntimeException("You do not have permission to delete this record.");
        }
        
        studentRecordRepository.delete(record);
    }
}

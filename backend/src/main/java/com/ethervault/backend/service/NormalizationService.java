package com.ethervault.backend.service;

import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NormalizationService {

    public String normalize(String studentName, String degreeName, String branch,
                            String universityName, String registerNumber,
                            String yearOfPassing, String certificateNumber, String dateOfIssue) {

        String normName     = clean(studentName);
        String normDegree   = clean(degreeName);
        String normBranch   = clean(branch);
        String normUni      = clean(universityName);
        String normRegNo    = clean(registerNumber);
        String normYear     = clean(yearOfPassing);
        String normCertNo   = clean(certificateNumber);
        String normDate     = normalizeDate(dateOfIssue);

        String canonical = String.format("%s|%s|%s|%s|%s|%s|%s|%s",
                normName, normDegree, normBranch, normUni,
                normRegNo, normYear, normCertNo, normDate);

        System.out.println("NORMALIZATION DEBUG:");
        System.out.println("  - Name: [" + normName + "]");
        System.out.println("  - Degree: [" + normDegree + "]");
        System.out.println("  - Branch: [" + normBranch + "]");
        System.out.println("  - University: [" + normUni + "]");
        System.out.println("  - RegNo: [" + normRegNo + "]");
        System.out.println("  - Year: [" + normYear + "]");
        System.out.println("  - CertNo: [" + normCertNo + "]");
        System.out.println("  - Date: [" + normDate + "]");
        System.out.println("CANONICAL STRING: " + canonical);

        return canonical;
    }

    /**
     * Normalize date to YYYY-MM-DD regardless of input format.
     * Handles: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, YYYY/MM/DD
     */
    private String normalizeDate(String date) {
        if (date == null || date.trim().isEmpty()) return "";
        date = date.trim();

        // Already YYYY-MM-DD
        if (date.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return date;
        }

        // DD-MM-YYYY or DD/MM/YYYY
        Matcher m = Pattern.compile("(\\d{1,2})[\\-/](\\d{1,2})[\\-/](\\d{4})").matcher(date);
        if (m.find()) {
            String day = String.format("%02d", Integer.parseInt(m.group(1)));
            String month = String.format("%02d", Integer.parseInt(m.group(2)));
            String year = m.group(3);
            return year + "-" + month + "-" + day;
        }

        // YYYY/MM/DD
        Matcher m2 = Pattern.compile("(\\d{4})[/](\\d{1,2})[/](\\d{1,2})").matcher(date);
        if (m2.find()) {
            String year = m2.group(1);
            String month = String.format("%02d", Integer.parseInt(m2.group(2)));
            String day = String.format("%02d", Integer.parseInt(m2.group(3)));
            return year + "-" + month + "-" + day;
        }

        return date;
    }

    /** 
     * Normalizes text fields:
     * 1. Uppercases
     * 2. Removes all non-alphanumeric characters
     * 3. Ignores common OCR placeholder strings
     */
    private String clean(String input) {
        if (input == null || input.trim().isEmpty()) return "";
        
        String val = input.trim();
        
        // Treat common "Missing" placeholders as empty string
        String lower = val.toLowerCase();
        if (lower.equals("not found") || lower.equals("n/a") || lower.equals("nil") || lower.equals("null")) {
            return "";
        }
        
        return val.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    public String generateHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }
            String result = hexString.toString();
            System.out.println("GENERATED HASH: " + result);
            return result;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error generating SHA-256 hash", e);
        }
    }
}

package com.ethervault.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class AiExtractionService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String AI_SERVICE_URL = "http://127.0.0.1:8000/extract";

    /**
     * Sends the certificate document to the local Python DocTR FastAPI service for data extraction
     * @param document The uploaded certificate image/pdf
     * @return Extractions in Map format
     */
    public Map<String, String> extractCertificateData(MultipartFile document) throws Exception {
        log.info("Sending document to local AI DocTR microservice for advanced extraction...");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource resource = new ByteArrayResource(document.getBytes()) {
            @Override
            public String getFilename() {
                return document.getOriginalFilename() != null ? document.getOriginalFilename() : "doc.png";
            }
        };
        body.add("file", resource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(AI_SERVICE_URL, requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.get("success").asBoolean()) {
                    JsonNode dataNode = root.get("extracted_data");
                    Map<String, String> data = new HashMap<>();
                    data.put("studentName", dataNode.path("studentName").asText(""));
                    data.put("degreeName", dataNode.path("degreeName").asText(""));
                    data.put("branch", dataNode.path("branch").asText(""));
                    data.put("universityName", dataNode.path("universityName").asText(""));
                    data.put("registerNumber", dataNode.path("registerNumber").asText(""));
                    data.put("yearOfPassing", dataNode.path("yearOfPassing").asText(""));
                    data.put("certificateNumber", dataNode.path("certificateNumber").asText(""));
                    data.put("dateOfIssue", dataNode.path("dateOfIssue").asText(""));
                    data.put("rawText", root.path("raw_text").asText(""));
                    
                    log.info("DocTR AI Extraction Successful!");
                    return data;
                } else {
                    String error = root.path("error").asText("Unknown AI error");
                    log.error("AI service returned failure: {}", error);
                    throw new RuntimeException("DocTR Extraction Failed: " + error);
                }
            } else {
                log.error("Failed to call AI microservice. Status: {}", response.getStatusCode());
                throw new RuntimeException("Failed to call AI Microservice");
            }
        } catch (Exception e) {
            log.error("Connection failed! Make sure the Python FastAPI OCR service is running on port 8000.", e);
            throw new RuntimeException("AI Microservice Connection Error. Is it running?", e);
        }
    }
}

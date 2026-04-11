package com.ethervault.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

@Service
@Slf4j
public class IpfsService {

    @Value("${pinata.api.key}")
    private String pinataApiKey;

    @Value("${pinata.api.secret}")
    private String pinataApiSecret;

    private static final String PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String uploadToIpfs(MultipartFile file) {
        log.info("Uploading file to IPFS via Pinata...");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("pinata_api_key", pinataApiKey);
        headers.set("pinata_secret_api_key", pinataApiSecret);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        try {
            // Spring's RestTemplate requires a custom ByteArrayResource with a filename for multipart upload
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
                }
            };
            body.add("file", resource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(PINATA_URL, requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String cid = root.get("IpfsHash").asText();
                log.info("Successfully uploaded to IPFS. CID: {}", cid);
                return cid;
            } else {
                log.error("Failed to upload to IPFS. Status: {}", response.getStatusCode());
                throw new RuntimeException("IPFS Upload Failed: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error during IPFS upload: {}", e.getMessage(), e);
            throw new RuntimeException("Error during IPFS upload", e);
        }
    }
}

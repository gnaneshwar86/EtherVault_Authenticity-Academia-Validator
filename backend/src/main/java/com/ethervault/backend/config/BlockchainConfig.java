package com.ethervault.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

@Configuration
public class BlockchainConfig {

    @Value("${polygon.rpc.url}")
    private String rpcUrl;

    @Value("${polygon.private.key}")
    private String privateKey;

    @Bean
    public Web3j web3j() {
        if (rpcUrl == null || rpcUrl.isBlank() || rpcUrl.contains("YOUR_ALCHEMY_API_KEY")) {
            return null; // Handle disabled case
        }
        return Web3j.build(new HttpService(rpcUrl));
    }

    @Bean
    public Credentials credentials() {
        if (privateKey == null || privateKey.isBlank() || privateKey.contains("YOUR_PRIVATE_KEY")) {
            return null; // Handle disabled case
        }
        return Credentials.create(privateKey);
    }
}

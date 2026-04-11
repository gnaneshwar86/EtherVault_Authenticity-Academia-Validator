package com.ethervault.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Bool;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.generated.Bytes32;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthCall;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.DefaultGasProvider;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
@Service
@Slf4j
public class BlockchainService {

    private final Web3j web3j;
    private final Credentials credentials;
    private final boolean blockchainEnabled;

    @Value("${polygon.contract.address}")
    private String contractAddress;

    @Value("${polygon.chain.id:1337}")
    private long chainId;

    public BlockchainService(@Autowired(required = false) Web3j web3j, 
                             @Autowired(required = false) Credentials credentials) {
        this.web3j = web3j;
        this.credentials = credentials;
        this.blockchainEnabled = (web3j != null && credentials != null);
    }

    @PostConstruct
    public void init() {
        if (!blockchainEnabled) {
            log.warn("Blockchain service is DISABLED — check application.properties for Polygon Amoy configuration");
        } else {
            log.info("Blockchain service ENABLED. Active Wallet: {}", credentials.getAddress());
            log.info("Polygon Amoy Network connected. Chain ID: {}. Smart Contract: {}", chainId, contractAddress);
            
            // Proactive Balance Check
            try {
                BigInteger balance = web3j.ethGetBalance(credentials.getAddress(), org.web3j.protocol.core.DefaultBlockParameterName.LATEST).send().getBalance();
                String maticBalance = new java.math.BigDecimal(balance).divide(new java.math.BigDecimal(10).pow(18)).setScale(4, java.math.RoundingMode.HALF_UP).toString();
                log.info("Wallet Balance: {} MATIC", maticBalance);
            } catch (Exception e) {
                log.warn("Could not fetch wallet balance: {}", e.getMessage());
            }
        }
    }

    /**
     * Store a SHA256 certificate hash on the blockchain.
     */
    public String storeHashOnBlockchain(String hash) throws Exception {
        if (!blockchainEnabled) {
            return "MOCK_TX_" + UUID.randomUUID().toString().substring(0, 8);
        }

        byte[] hashBytes = formatHashToBytes32(hash);

        Function function = new Function(
                "storeCertificateHash",
                Collections.singletonList(new Bytes32(hashBytes)),
                Collections.emptyList());

        return sendTransaction(function);
    }

    /**
     * Verify if a certificate hash exists on the blockchain.
     */
    public boolean verifyHashOnBlockchain(String hash) throws Exception {
        if (!blockchainEnabled) {
            return false;
        }

        byte[] hashBytes = formatHashToBytes32(hash);

        Function function = new Function(
                "verifyCertificateHash",
                Collections.singletonList(new Bytes32(hashBytes)),
                Arrays.asList(new TypeReference<Bool>() {}, new TypeReference<Address>() {}));

        String encodedFunction = FunctionEncoder.encode(function);
        EthCall response = web3j.ethCall(
                Transaction.createEthCallTransaction(null, contractAddress, encodedFunction),
                DefaultBlockParameterName.LATEST).send();

        List<Type> values = FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());
        if (values == null || values.isEmpty()) return false;

        return (boolean) values.get(0).getValue();
    }

    /**
     * Authorize an institution.
     */
    public String authorizeInstitution(String walletAddress) throws Exception {
        validateAddress(walletAddress);
        if (!blockchainEnabled) {
            return "MOCK_AUTH_TX_" + UUID.randomUUID().toString().substring(0, 8);
        }
        Function function = new Function(
                "authorizeInstitution",
                Collections.singletonList(new Address(walletAddress)),
                Collections.emptyList());

        return sendTransaction(function);
    }

    /**
     * Revoke an institution.
     */
    public String revokeInstitution(String walletAddress) throws Exception {
        validateAddress(walletAddress);
        if (!blockchainEnabled) {
            return "MOCK_REVOKE_TX_" + UUID.randomUUID().toString().substring(0, 8);
        }
        Function function = new Function(
                "revokeInstitution",
                Collections.singletonList(new Address(walletAddress)),
                Collections.emptyList());

        return sendTransaction(function);
    }

    // ─────────────────────────── Helpers ───────────────────────────────────

    private byte[] formatHashToBytes32(String hash) {
        String formattedHash = hash.startsWith("0x") ? hash : "0x" + hash;
        byte[] hashBytes = Numeric.hexStringToByteArray(formattedHash);
        if (hashBytes.length != 32) {
            throw new IllegalArgumentException("Hash must be exactly 32 bytes (64 hex characters)");
        }
        return hashBytes;
    }

    private void validateAddress(String address) {
        if (address == null || !address.matches("^0x[a-fA-F0-9]{40}$")) {
            throw new IllegalArgumentException("Invalid Ethereum wallet address");
        }
    }

    private String sendTransaction(Function function) throws Exception {
        TransactionManager txManager = new RawTransactionManager(web3j, credentials, chainId);
        String encodedFunction = FunctionEncoder.encode(function);

        // Increase gas price for Amoy consistency (often requires 100+ Gwei)
        BigInteger gasPrice = BigInteger.valueOf(150_000_000_000L); // 150 Gwei
        BigInteger gasLimit = BigInteger.valueOf(200_000L); // Sufficient for simple storeHash function

        org.web3j.protocol.core.methods.response.EthSendTransaction response =
                txManager.sendTransaction(
                        gasPrice,
                        gasLimit,
                        contractAddress,
                        encodedFunction,
                        BigInteger.ZERO);

        if (response.hasError()) {
            log.error("Blockchain Broadcast Error: {}", response.getError().getMessage());
            throw new RuntimeException("Blockchain broadcast failed: " + response.getError().getMessage());
        }

        String txHash = response.getTransactionHash();
        log.info("Transaction broadcast successful. Hash: {}. Waiting for confirmation...", txHash);

        // Wait for transaction to be mined
        java.util.Optional<org.web3j.protocol.core.methods.response.TransactionReceipt> receipt;
        int attempts = 0;
        do {
            receipt = web3j.ethGetTransactionReceipt(txHash).send().getTransactionReceipt();
            if (receipt.isEmpty()) {
                Thread.sleep(3000); // 3 seconds between polls
                attempts++;
            }
        } while (receipt.isEmpty() && attempts < 40); // Wait up to 120 seconds

        if (receipt.isPresent()) {
            if ("0x1".equals(receipt.get().getStatus())) {
                log.info("Transaction SUCCEEDED on-chain! Block: {}", receipt.get().getBlockNumber());
                return txHash;
            } else {
                log.error("Transaction REVERTED! Status: {}. Wallet: {}", 
                    receipt.get().getStatus(), credentials.getAddress());
                throw new RuntimeException("Blockchain transaction reverted on-chain.");
            }
        } else {
            log.error("Transaction Timeout! Hash: {} is still pending after 2 minutes.", txHash);
            throw new RuntimeException("Blockchain transaction timed out. It may anchor eventually, but not confirmed yet.");
        }
    }
}

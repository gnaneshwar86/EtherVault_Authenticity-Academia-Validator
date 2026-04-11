package com.ethervault.backend.service;

import com.ethervault.backend.model.BlockchainEvent;
import com.ethervault.backend.repository.BlockchainEventRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.EventEncoder;
import org.web3j.abi.EventValues;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Event;
import org.web3j.abi.datatypes.generated.Bytes32;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.EthFilter;
import org.web3j.tx.Contract;
import org.web3j.utils.Numeric;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class BlockchainEventListener {

    private final Web3j web3j;
    private final BlockchainEventRepository eventRepository;

    @Value("${polygon.contract.address}")
    private String contractAddress;

    @Value("${blockchain.events.enabled:true}")
    private boolean eventsEnabled;

    // Event Definitions
    private static final Event INSTITUTION_AUTHORIZED_EVENT = new Event("InstitutionAuthorized",
            List.of(new TypeReference<Address>(true) {}));

    private static final Event INSTITUTION_REVOKED_EVENT = new Event("InstitutionRevoked",
            List.of(new TypeReference<Address>(true) {}));

    private static final Event CERTIFICATE_HASH_STORED_EVENT = new Event("CertificateHashStored",
            Arrays.asList(new TypeReference<Bytes32>(true) {}, new TypeReference<Address>(true) {}));

    @PostConstruct
    public void startListening() {
        if (!eventsEnabled || web3j == null || contractAddress == null || contractAddress.equals("0x0000000000000000000000000000000000000000")) {
            log.warn("Blockchain Event Listener is DISABLED or contract address not configured.");
            return;
        }

        log.info("Starting Blockchain Event Listener for address: {}", contractAddress);

        EthFilter filter = new EthFilter(DefaultBlockParameterName.LATEST, DefaultBlockParameterName.LATEST, contractAddress);

        web3j.ethLogFlowable(filter).subscribe(eventLog -> {
            String transactionHash = eventLog.getTransactionHash();
            
            // Check if already processed
            if (eventRepository.findByTransactionHash(transactionHash).isPresent()) {
                return;
            }

            List<String> topics = eventLog.getTopics();
            String eventHash = topics.get(0);

            if (eventHash.equals(EventEncoder.encode(INSTITUTION_AUTHORIZED_EVENT))) {
                handleInstitutionEvent(eventLog, "INSTITUTION_AUTHORIZED");
            } else if (eventHash.equals(EventEncoder.encode(INSTITUTION_REVOKED_EVENT))) {
                handleInstitutionEvent(eventLog, "INSTITUTION_REVOKED");
            } else if (eventHash.equals(EventEncoder.encode(CERTIFICATE_HASH_STORED_EVENT))) {
                handleCertificateStoredEvent(eventLog);
            }
        }, throwable -> log.error("Error in event listener: ", throwable));
    }

    private void handleInstitutionEvent(org.web3j.protocol.core.methods.response.Log eventLog, String type) {
        EventValues eventValues = Contract.staticExtractEventParameters(
                type.equals("INSTITUTION_AUTHORIZED") ? INSTITUTION_AUTHORIZED_EVENT : INSTITUTION_REVOKED_EVENT, 
                eventLog);
        
        String address = (String) eventValues.getIndexedValues().get(0).getValue();
        
        saveEvent(type, address, null, eventLog.getTransactionHash());
        log.info("Blockchain Event [{}]: Institution {}", type, address);
    }

    private void handleCertificateStoredEvent(org.web3j.protocol.core.methods.response.Log eventLog) {
        EventValues eventValues = Contract.staticExtractEventParameters(CERTIFICATE_HASH_STORED_EVENT, eventLog);
        
        byte[] hashBytes = (byte[]) eventValues.getIndexedValues().get(0).getValue();
        String hash = Numeric.toHexString(hashBytes);
        String institution = (String) eventValues.getIndexedValues().get(1).getValue();

        saveEvent("CERTIFICATE_HASH_STORED", institution, hash, eventLog.getTransactionHash());
        log.info("Blockchain Event [CERTIFICATE_HASH_STORED]: Hash {} stored by {}", hash, institution);
    }

    private void saveEvent(String type, String address, String hash, String txHash) {
        BlockchainEvent event = BlockchainEvent.builder()
                .eventType(type)
                .walletAddress(address)
                .certificateHash(hash)
                .transactionHash(txHash)
                .timestamp(LocalDateTime.now())
                .build();
        eventRepository.save(event);
    }
}

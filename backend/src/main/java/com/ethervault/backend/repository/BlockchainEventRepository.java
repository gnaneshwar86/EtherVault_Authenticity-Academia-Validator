package com.ethervault.backend.repository;

import com.ethervault.backend.model.BlockchainEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlockchainEventRepository extends JpaRepository<BlockchainEvent, Long> {
    Optional<BlockchainEvent> findByTransactionHash(String transactionHash);
}

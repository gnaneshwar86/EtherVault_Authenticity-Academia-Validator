package com.ethervault.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blockchain_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockchainEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "wallet_address")
    private String walletAddress;

    @Column(name = "certificate_hash")
    private String certificateHash;

    @Column(name = "transaction_hash", unique = true, nullable = false)
    private String transactionHash;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;
}

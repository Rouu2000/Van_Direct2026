package com.deliveryplatform.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "driver_statuses")
@Data
public class DriverStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true)
    private UUID driverId;

    @Enumerated(EnumType.STRING)
    @Column
    private Status status;

    private LocalDateTime lastUpdatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        lastUpdatedAt = LocalDateTime.now();
        if (status == null) {
            status = Status.OFFLINE;
        }
    }

    public enum Status {
        AVAILABLE,
        UNAVAILABLE,
        ON_DELIVERY,
        OFFLINE
    }
}

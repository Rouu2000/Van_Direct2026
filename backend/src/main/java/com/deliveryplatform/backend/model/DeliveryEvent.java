package com.deliveryplatform.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "delivery_events")
@Data
public class DeliveryEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column
    private UUID shipmentId;

    @Column
    private UUID driverId;

    @Enumerated(EnumType.STRING)
    @Column
    private EventType eventType;

    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }

    public enum EventType {
        ASSIGNED,
        ACCEPTED,
        PICKED_UP,
        DELIVERED,
        REASSIGNED
    }
}

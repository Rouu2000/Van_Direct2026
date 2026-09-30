package com.deliveryplatform.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Entity
@Table(name = "shipments")
@Data
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true)
    private String trackingNumber;

    @Column
    private UUID customerId;

    @Column
    private String pickupAddress;

    @Column
    private Double pickupLat;

    @Column
    private Double pickupLng;

    @Column
    private String recipientName;

    @Column
    private String recipientPhone;

    @Column
    private String dropoffAddress;

    @Column
    private Double dropoffLat;

    @Column
    private Double dropoffLng;

    @Enumerated(EnumType.STRING)
    @Column
    private ServiceTier serviceTier;

    @Enumerated(EnumType.STRING)
    @Column
    private ShipmentStatus status;

    @Column(precision = 10, scale = 2)
    private BigDecimal priceAmount;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime deliveredAt;

    private UUID assignedDriverId;

    private LocalDateTime offerExpiresAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "shipment_excluded_drivers", joinColumns = @JoinColumn(name = "shipment_id"))
    @Column(name = "driver_id")
    private Set<UUID> excludedDriverIds = new HashSet<>();

    public enum ServiceTier {
        STANDARD,
        EXPRESS
    }

    public enum ShipmentStatus {
        BOOKED,
        DRIVER_ASSIGNED,
        PICKED_UP,
        DELIVERED,
        CANCELLED
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (trackingNumber == null || trackingNumber.isBlank()) {
            trackingNumber = generateTrackingNumber();
        }
        if (status == null) {
            status = ShipmentStatus.BOOKED;
        }
    }

    public static String generateTrackingNumber() {
        int code = ThreadLocalRandom.current().nextInt(100000, 1000000);
        return "TRK-" + code;
    }
}

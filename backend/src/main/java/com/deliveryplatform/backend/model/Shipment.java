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

    // ── Legacy address strings (kept for display everywhere) ──────────
    @Column
    private String pickupAddress;

    @Column
    private Double pickupLat;

    @Column
    private Double pickupLng;

    @Column
    private String dropoffAddress;

    @Column
    private Double dropoffLat;

    @Column
    private Double dropoffLng;

    // ── Structured pickup address (all nullable so old rows keep working) ──
    @Column private String pickupContactName;
    @Column private String pickupCompany;
    @Column private String pickupPhone;
    @Column private String pickupEmail;
    @Column private String pickupLine1;
    @Column private String pickupLine2;
    @Column private String pickupPostalCode;
    @Column private String pickupProvince;
    @Column private String pickupCity;
    @Column private Boolean pickupResidential;
    @Enumerated(EnumType.STRING) @Column private GeoAccuracy pickupGeoAccuracy;

    // ── Structured drop-off address (all nullable) ─────────────────────
    @Column private String dropoffContactName;
    @Column private String dropoffCompany;
    @Column private String dropoffPhone;
    @Column private String dropoffEmail;
    @Column private String dropoffLine1;
    @Column private String dropoffLine2;
    @Column private String dropoffPostalCode;
    @Column private String dropoffProvince;
    @Column private String dropoffCity;
    @Column private Boolean dropoffResidential;
    @Enumerated(EnumType.STRING) @Column private GeoAccuracy dropoffGeoAccuracy;

    // ── Existing fields ───────────────────────────────────────────────
    @Column
    private String recipientName;

    @Column
    private String recipientPhone;

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

    public enum ServiceTier { STANDARD, EXPRESS }

    public enum ShipmentStatus {
        BOOKED, DRIVER_ASSIGNED, PICKED_UP, DELIVERED, CANCELLED
    }

    public enum GeoAccuracy { ADDRESS, POSTAL_CODE, CITY, MANUAL }

    /** Build the display address string from structured parts. */
    public static String composeAddress(String line1, String line2, String city,
                                        String province, String postalCode) {
        StringBuilder sb = new StringBuilder();
        if (line1 != null && !line1.isBlank()) sb.append(line1);
        if (line2 != null && !line2.isBlank()) { if (sb.length() > 0) sb.append(", "); sb.append(line2); }
        if (city != null && !city.isBlank()) { if (sb.length() > 0) sb.append(", "); sb.append(city); }
        if (province != null && !province.isBlank()) { if (sb.length() > 0) sb.append(", "); sb.append(province); }
        if (postalCode != null && !postalCode.isBlank()) { if (sb.length() > 0) sb.append(" "); sb.append(postalCode); }
        return sb.toString();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (trackingNumber == null || trackingNumber.isBlank()) trackingNumber = generateTrackingNumber();
        if (status == null) status = ShipmentStatus.BOOKED;
    }

    public static String generateTrackingNumber() {
        int code = ThreadLocalRandom.current().nextInt(100000, 1000000);
        return "TRK-" + code;
    }
}

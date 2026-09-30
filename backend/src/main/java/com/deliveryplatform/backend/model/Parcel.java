package com.deliveryplatform.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "parcels")
@Data
public class Parcel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column
    private UUID shipmentId;

    @Column(precision = 10, scale = 2)
    private BigDecimal weightKg;

    @Enumerated(EnumType.STRING)
    @Column
    private SizeCategory sizeCategory;

    @Column
    private String description;

    @Column(precision = 10, scale = 2)
    private BigDecimal declaredValue;

    public enum SizeCategory {
        SMALL,
        MEDIUM,
        LARGE
    }
}

package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.Parcel;
import com.deliveryplatform.backend.model.Shipment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class PriceCalculatorTest {

    private PriceCalculator priceCalculator;

    @BeforeEach
    void setUp() {
        priceCalculator = new PriceCalculator(
                new BigDecimal("5.00"),
                new BigDecimal("1.50"),
                new BigDecimal("0.50"),
                new BigDecimal("1.0"),
                new BigDecimal("1.5"),
                new BigDecimal("2.0"),
                new BigDecimal("1.0"),
                new BigDecimal("1.5")
        );
    }

    @Test
    void priceIncreasesWithDistance() {
        Parcel parcel = new Parcel();
        parcel.setWeightKg(new BigDecimal("2.0"));
        parcel.setSizeCategory(Parcel.SizeCategory.SMALL);

        BigDecimal near = priceCalculator.calculateTotalShipment(
                List.of(parcel), Shipment.ServiceTier.STANDARD, 5.0);
        BigDecimal far = priceCalculator.calculateTotalShipment(
                List.of(parcel), Shipment.ServiceTier.STANDARD, 25.0);

        assertTrue(far.compareTo(near) > 0, "Longer distance must cost more");
    }

    @Test
    void distanceServiceHaversineIsPositive() {
        DistanceService distanceService = new DistanceService();
        double km = distanceService.haversineKm(48.8566, 2.3522, 48.8600, 2.3600);
        assertTrue(km > 0);
    }
}

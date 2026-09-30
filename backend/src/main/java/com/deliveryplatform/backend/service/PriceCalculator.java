package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.Parcel;
import com.deliveryplatform.backend.model.Shipment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
public class PriceCalculator {

    private final BigDecimal basePrice;
    private final BigDecimal ratePerKg;
    private final BigDecimal ratePerKm;
    private final BigDecimal sizeSmall;
    private final BigDecimal sizeMedium;
    private final BigDecimal sizeLarge;
    private final BigDecimal tierStandard;
    private final BigDecimal tierExpress;

    public PriceCalculator(
            @Value("${pricing.base:5.00}") BigDecimal basePrice,
            @Value("${pricing.rate-per-kg:1.50}") BigDecimal ratePerKg,
            @Value("${pricing.rate-per-km:0.50}") BigDecimal ratePerKm,
            @Value("${pricing.size.small:1.0}") BigDecimal sizeSmall,
            @Value("${pricing.size.medium:1.5}") BigDecimal sizeMedium,
            @Value("${pricing.size.large:2.0}") BigDecimal sizeLarge,
            @Value("${pricing.tier.standard:1.0}") BigDecimal tierStandard,
            @Value("${pricing.tier.express:1.5}") BigDecimal tierExpress
    ) {
        this.basePrice = basePrice;
        this.ratePerKg = ratePerKg;
        this.ratePerKm = ratePerKm;
        this.sizeSmall = sizeSmall;
        this.sizeMedium = sizeMedium;
        this.sizeLarge = sizeLarge;
        this.tierStandard = tierStandard;
        this.tierExpress = tierExpress;
    }

    public BigDecimal calculateParcelPrice(
            BigDecimal weight,
            Parcel.SizeCategory size,
            Shipment.ServiceTier tier
    ) {
        return calculateParcelPrice(weight, size, tier, 0.0);
    }

    public BigDecimal calculateParcelPrice(
            BigDecimal weight,
            Parcel.SizeCategory size,
            Shipment.ServiceTier tier,
            double distanceKm
    ) {
        if (weight == null) {
            weight = BigDecimal.ZERO;
        }

        BigDecimal sizeMultiplier = switch (size) {
            case SMALL -> sizeSmall;
            case MEDIUM -> sizeMedium;
            case LARGE -> sizeLarge;
        };
        BigDecimal tierMultiplier = (tier == Shipment.ServiceTier.EXPRESS) ? tierExpress : tierStandard;

        // ((base + weight-based part) × sizeMultiplier + distanceKm × ratePerKm) × serviceTierMultiplier
        BigDecimal weightPart = weight.multiply(ratePerKg);
        BigDecimal priced = basePrice
                .add(weightPart)
                .multiply(sizeMultiplier)
                .add(BigDecimal.valueOf(distanceKm).multiply(ratePerKm))
                .multiply(tierMultiplier);

        return priced.setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateTotalShipment(List<Parcel> parcels, Shipment.ServiceTier tier) {
        return calculateTotalShipment(parcels, tier, 0.0);
    }

    public BigDecimal calculateTotalShipment(List<Parcel> parcels, Shipment.ServiceTier tier, double distanceKm) {
        if (parcels == null || parcels.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal parcelsSubtotal = BigDecimal.ZERO;
        for (Parcel parcel : parcels) {
            BigDecimal weight = parcel.getWeightKg() == null ? BigDecimal.ZERO : parcel.getWeightKg();
            BigDecimal sizeMultiplier = switch (parcel.getSizeCategory()) {
                case SMALL -> sizeSmall;
                case MEDIUM -> sizeMedium;
                case LARGE -> sizeLarge;
            };
            // (base + weight-based part) × sizeMultiplier per parcel
            parcelsSubtotal = parcelsSubtotal.add(
                    basePrice.add(weight.multiply(ratePerKg)).multiply(sizeMultiplier)
            );
        }

        BigDecimal tierMultiplier = (tier == Shipment.ServiceTier.EXPRESS) ? tierExpress : tierStandard;
        // (parcelsSubtotal + distanceKm × ratePerKm) × serviceTierMultiplier
        BigDecimal total = parcelsSubtotal
                .add(BigDecimal.valueOf(distanceKm).multiply(ratePerKm))
                .multiply(tierMultiplier);

        return total.setScale(2, RoundingMode.HALF_UP);
    }
}

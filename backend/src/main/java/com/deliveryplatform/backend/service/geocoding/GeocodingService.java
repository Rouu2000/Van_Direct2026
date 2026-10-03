package com.deliveryplatform.backend.service.geocoding;

import com.deliveryplatform.backend.model.Shipment;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class GeocodingService {
    private final GeocodingProvider provider;
    public GeocodingService(GeocodingProvider provider) { this.provider = provider; }

    public Optional<GeocodingResult> geocode(String line1, String city, String province,
                                              String postalCode) {
        return provider.geocode(line1, city, province,
                NominatimGeocodingProvider.normalizePostalCode(postalCode), "Canada");
    }

    /** Convert GeocodingResult.Accuracy to Shipment.GeoAccuracy */
    public static Shipment.GeoAccuracy toShipmentAccuracy(GeocodingResult.Accuracy a) {
        return switch (a) {
            case ADDRESS     -> Shipment.GeoAccuracy.ADDRESS;
            case POSTAL_CODE -> Shipment.GeoAccuracy.POSTAL_CODE;
            case CITY        -> Shipment.GeoAccuracy.CITY;
            case MANUAL      -> Shipment.GeoAccuracy.MANUAL;
        };
    }
}

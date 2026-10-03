package com.deliveryplatform.backend.service.geocoding;

import java.util.Optional;

/** Swappable geocoding backend. Default: Nominatim. */
public interface GeocodingProvider {
    /**
     * Geocode a structured Canadian address.
     * Strategy: (1) full address, (2) postal code only, (3) city + province.
     */
    Optional<GeocodingResult> geocode(String line1, String city, String province,
                                      String postalCode, String country);
}

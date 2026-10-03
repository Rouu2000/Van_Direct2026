package com.deliveryplatform.backend.controller;

import com.deliveryplatform.backend.service.geocoding.GeocodingResult;
import com.deliveryplatform.backend.service.geocoding.GeocodingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/geocode")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("isAuthenticated()")
public class GeocodingController {

    private final GeocodingService geocodingService;

    public GeocodingController(GeocodingService geocodingService) {
        this.geocodingService = geocodingService;
    }

    @PostMapping
    public ResponseEntity<?> geocode(@RequestBody GeocodeRequest req) {
        if (req.getCity() == null || req.getCity().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "city is required"));
        }
        Optional<GeocodingResult> result = geocodingService.geocode(
                req.getLine1() != null ? req.getLine1() : "",
                req.getCity(),
                req.getProvince() != null ? req.getProvince() : "ON",
                req.getPostalCode() != null ? req.getPostalCode() : ""
        );
        return result
            .<ResponseEntity<?>>map(r -> ResponseEntity.ok(Map.of(
                "lat", r.getLat(), "lng", r.getLng(), "accuracy", r.getAccuracy()
            )))
            .orElseGet(() -> ResponseEntity.ok(Map.of(
                "lat", (Object)null, "lng", (Object)null, "accuracy", "NONE",
                "message", "Location not found — shipment accepted but map pin may be approximate"
            )));
    }

    public static class GeocodeRequest {
        private String line1, city, province, postalCode;
        public String getLine1() { return line1; }
        public void setLine1(String v) { this.line1 = v; }
        public String getCity() { return city; }
        public void setCity(String v) { this.city = v; }
        public String getProvince() { return province; }
        public void setProvince(String v) { this.province = v; }
        public String getPostalCode() { return postalCode; }
        public void setPostalCode(String v) { this.postalCode = v; }
    }
}

package com.deliveryplatform.backend.controller;

import com.deliveryplatform.backend.config.JwtUtil;
import com.deliveryplatform.backend.model.DriverStatus;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.UserRepository;
import com.deliveryplatform.backend.service.DriverLocationService;
import com.deliveryplatform.backend.service.DriverStatusService;
import com.deliveryplatform.backend.service.ShipmentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("hasRole('DRIVER')")
public class DriverController {

    private final DriverStatusService driverStatusService;
    private final DriverLocationService driverLocationService;
    private final ShipmentService shipmentService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public DriverController(
            DriverStatusService driverStatusService,
            DriverLocationService driverLocationService,
            ShipmentService shipmentService,
            JwtUtil jwtUtil,
            UserRepository userRepository
    ) {
        this.driverStatusService = driverStatusService;
        this.driverLocationService = driverLocationService;
        this.shipmentService = shipmentService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @GetMapping("/{id}/status")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> getStatus(@PathVariable UUID id, HttpServletRequest request) {
        if (!isSameDriver(id, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Driver access required"));
        }
        return ResponseEntity.ok(driverStatusService.getOrCreateStatus(id));
    }

    @PutMapping("/{id}/availability")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> updateAvailability(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload,
            HttpServletRequest request
    ) {
        if (!isSameDriver(id, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Driver access required"));
        }
        try {
            String statusValue = payload.get("status");
            // Normalize legacy/non-spec values
            if ("UNAVAILABLE".equalsIgnoreCase(statusValue)) {
                statusValue = "OFFLINE";
            }
            DriverStatus.Status status = DriverStatus.Status.valueOf(statusValue.toUpperCase());
            // Only allow spec-valid transitions from driver's own UI
            if (status == DriverStatus.Status.UNAVAILABLE) {
                return ResponseEntity.badRequest().body(Map.of("message", "Use OFFLINE to go off duty"));
            }
            if (status == DriverStatus.Status.ON_DELIVERY) {
                return ResponseEntity.badRequest().body(Map.of("message", "ON_DELIVERY status is set by the system on shipment acceptance"));
            }
            return ResponseEntity.ok(driverStatusService.setStatus(id, status));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid availability status"));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/location")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> updateLocation(
            @PathVariable UUID id,
            @RequestBody LocationRequest payload,
            HttpServletRequest request
    ) {
        if (!isSameDriver(id, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Driver access required"));
        }
        return ResponseEntity.ok(driverLocationService.updateLocation(id, payload.getLat(), payload.getLng()));
    }

    @GetMapping("/{id}/deliveries")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> getDeliveries(@PathVariable UUID id, HttpServletRequest request) {
        if (!isSameDriver(id, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Driver access required"));
        }
        List<Shipment> deliveries = shipmentService.getDriverShipments(id);
        return ResponseEntity.ok(deliveries);
    }

    private boolean isSameDriver(UUID id, HttpServletRequest request) {
        String token = bearerToken(request);
        if (token != null) {
            try {
                String role = jwtUtil.extractRole(token);
                if (role != null && role.startsWith("ROLE_")) {
                    role = role.substring(5);
                }
                if (!"DRIVER".equalsIgnoreCase(role)) {
                    return false;
                }
                UUID tokenUserId = jwtUtil.extractUserId(token);
                if (tokenUserId != null) {
                    return tokenUserId.equals(id);
                }
                String email = jwtUtil.extractEmail(token);
                return userRepository.findByEmail(email)
                        .map(User::getId)
                        .filter(id::equals)
                        .isPresent();
            } catch (Exception ex) {
                return false;
            }
        }
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            boolean isDriver = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"));
            if (!isDriver) {
                return false;
            }
            return userRepository.findByEmail(auth.getName())
                    .map(User::getId)
                    .filter(id::equals)
                    .isPresent();
        }
        return false;
    }

    private String bearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring(7);
    }

    public static class LocationRequest {
        private double lat;
        private double lng;

        public double getLat() { return lat; }
        public void setLat(double lat) { this.lat = lat; }
        public double getLng() { return lng; }
        public void setLng(double lng) { this.lng = lng; }
    }
}

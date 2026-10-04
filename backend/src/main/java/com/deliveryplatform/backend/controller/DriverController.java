package com.deliveryplatform.backend.controller;

import com.deliveryplatform.backend.config.JwtUtil;
import com.deliveryplatform.backend.model.DriverStatus;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.ShipmentRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import com.deliveryplatform.backend.service.DriverLocationService;
import com.deliveryplatform.backend.service.DriverStatusService;
import com.deliveryplatform.backend.service.ShipmentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "http://localhost:4200")
public class DriverController {

    private final DriverStatusService driverStatusService;
    private final DriverLocationService driverLocationService;
    private final ShipmentService shipmentService;
    private final ShipmentRepository shipmentRepository;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public DriverController(
            DriverStatusService driverStatusService,
            DriverLocationService driverLocationService,
            ShipmentService shipmentService,
            ShipmentRepository shipmentRepository,
            JwtUtil jwtUtil,
            UserRepository userRepository
    ) {
        this.driverStatusService = driverStatusService;
        this.driverLocationService = driverLocationService;
        this.shipmentService = shipmentService;
        this.shipmentRepository = shipmentRepository;
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

    @GetMapping("/{id}/deliveries/history")
    @PreAuthorize("hasAnyRole('DRIVER','ADMIN')")
    public ResponseEntity<?> getDeliveryHistory(
            @PathVariable UUID id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        // Driver can only see their own history; admin can see any driver's
        String role = extractRole(request);
        if (!"ADMIN".equalsIgnoreCase(role) && !isSameDriver(id, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied"));
        }

        // Determine which statuses to include
        List<Shipment.ShipmentStatus> statuses;
        if (status != null && !status.isBlank()) {
            try {
                statuses = List.of(Shipment.ShipmentStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid status: " + status));
            }
        } else {
            statuses = List.of(Shipment.ShipmentStatus.DELIVERED, Shipment.ShipmentStatus.CANCELLED);
        }

        // Substitute sentinel bounds so the query never receives null parameters.
        // PostgreSQL cannot determine the type of an unbound null in (? IS NULL OR ...).
        LocalDateTime fromDt = (from != null)
                ? from.atStartOfDay()
                : LocalDateTime.of(2000, 1, 1, 0, 0);       // epoch-like lower bound
        LocalDateTime toDt   = (to != null)
                ? to.atTime(23, 59, 59)
                : LocalDateTime.of(2100, 12, 31, 23, 59, 59); // far-future upper bound

        PageRequest pageable = PageRequest.of(page, Math.min(size, 50));
        try {
            Page<Shipment> result = shipmentRepository.findDriverHistory(id, statuses, fromDt, toDt, pageable);
            Map<String, Object> response = new HashMap<>();
            response.put("content",       result.getContent());
            response.put("totalElements", result.getTotalElements());
            response.put("totalPages",    result.getTotalPages());
            response.put("page",          result.getNumber());
            response.put("size",          result.getSize());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to load history: " + e.getMessage()));
        }
    }

    private String extractRole(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String role = jwtUtil.extractRole(authHeader.substring(7));
                if (role != null && role.startsWith("ROLE_")) role = role.substring(5);
                return role != null ? role.toUpperCase() : null;
            } catch (Exception ignored) {}
        }
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            return auth.getAuthorities().stream()
                    .map(a -> a.getAuthority().replace("ROLE_", ""))
                    .findFirst().orElse(null);
        }
        return null;
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

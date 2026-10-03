package com.deliveryplatform.backend.controller;

import com.deliveryplatform.backend.config.JwtUtil;
import com.deliveryplatform.backend.model.Parcel;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.UserRepository;
import com.deliveryplatform.backend.service.AssignmentService;
import com.deliveryplatform.backend.service.DistanceService;
import com.deliveryplatform.backend.service.DriverLocationService;
import com.deliveryplatform.backend.service.ParcelService;
import com.deliveryplatform.backend.service.ShipmentService;
import com.deliveryplatform.backend.service.geocoding.GeocodingResult;
import com.deliveryplatform.backend.service.geocoding.GeocodingService;
import com.deliveryplatform.backend.service.geocoding.NominatimGeocodingProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/shipments")
@CrossOrigin(origins = "http://localhost:4200")
public class ShipmentController {

    private static final Logger log = LoggerFactory.getLogger(ShipmentController.class);

    private final ShipmentService shipmentService;
    private final ParcelService parcelService;
    private final JwtUtil jwtUtil;
    private final AssignmentService assignmentService;
    private final DriverLocationService driverLocationService;
    private final UserRepository userRepository;
    private final DistanceService distanceService;
    private final GeocodingService geocodingService;

    public ShipmentController(
            ShipmentService shipmentService,
            ParcelService parcelService,
            JwtUtil jwtUtil,
            AssignmentService assignmentService,
            DriverLocationService driverLocationService,
            UserRepository userRepository,
            DistanceService distanceService,
            GeocodingService geocodingService
    ) {
        this.shipmentService = shipmentService;
        this.parcelService = parcelService;
        this.jwtUtil = jwtUtil;
        this.assignmentService = assignmentService;
        this.driverLocationService = driverLocationService;
        this.userRepository = userRepository;
        this.distanceService = distanceService;
        this.geocodingService = geocodingService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createShipment(
            @Valid @RequestBody CreateShipmentRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            UUID callerId = currentUserId(httpRequest);
            if (callerId != null && request.getCustomerId() == null) {
                request.setCustomerId(callerId);
            }
            Shipment shipment = new Shipment();
            shipment.setCustomerId(request.getCustomerId());
            shipment.setRecipientName(request.getRecipientName());
            shipment.setRecipientPhone(request.getRecipientPhone());
            shipment.setServiceTier(Shipment.ServiceTier.valueOf(request.getServiceTier().toUpperCase()));

            // ── Pickup address ────────────────────────────────────────────
            boolean hasStructuredPickup = request.getPickupLine1() != null && !request.getPickupLine1().isBlank();
            String geoWarning = null;

            if (hasStructuredPickup) {
                // Store structured fields
                shipment.setPickupContactName(request.getPickupContactName());
                shipment.setPickupCompany(request.getPickupCompany());
                shipment.setPickupPhone(normalizePhone(request.getPickupPhone()));
                shipment.setPickupEmail(request.getPickupEmail());
                shipment.setPickupLine1(request.getPickupLine1());
                shipment.setPickupLine2(request.getPickupLine2());
                shipment.setPickupPostalCode(NominatimGeocodingProvider.normalizePostalCode(request.getPickupPostalCode()));
                shipment.setPickupProvince(request.getPickupProvince());
                shipment.setPickupCity(request.getPickupCity());
                shipment.setPickupResidential(Boolean.TRUE.equals(request.getPickupResidential()));
                // Compose display string
                shipment.setPickupAddress(Shipment.composeAddress(
                        request.getPickupLine1(), request.getPickupLine2(),
                        request.getPickupCity(), request.getPickupProvince(),
                        shipment.getPickupPostalCode()));
                // Geocode
                Optional<GeocodingResult> geo = geocodingService.geocode(
                        request.getPickupLine1(), request.getPickupCity(),
                        request.getPickupProvince(), request.getPickupPostalCode());
                if (geo.isPresent()) {
                    shipment.setPickupLat(geo.get().getLat());
                    shipment.setPickupLng(geo.get().getLng());
                    shipment.setPickupGeoAccuracy(GeocodingService.toShipmentAccuracy(geo.get().getAccuracy()));
                } else {
                    geoWarning = "Pickup location could not be geocoded — map pin will be approximate.";
                    log.warn("Pickup geocoding failed for: {}", shipment.getPickupAddress());
                }
            } else {
                // Legacy: accept raw address + lat/lng from the request
                shipment.setPickupAddress(request.getPickupAddress());
                shipment.setPickupLat(request.getPickupLat());
                shipment.setPickupLng(request.getPickupLng());
            }

            // ── Drop-off address ──────────────────────────────────────────
            boolean hasStructuredDropoff = request.getDropoffLine1() != null && !request.getDropoffLine1().isBlank();

            if (hasStructuredDropoff) {
                shipment.setDropoffContactName(request.getDropoffContactName());
                shipment.setDropoffCompany(request.getDropoffCompany());
                shipment.setDropoffPhone(normalizePhone(request.getDropoffPhone()));
                shipment.setDropoffEmail(request.getDropoffEmail());
                shipment.setDropoffLine1(request.getDropoffLine1());
                shipment.setDropoffLine2(request.getDropoffLine2());
                shipment.setDropoffPostalCode(NominatimGeocodingProvider.normalizePostalCode(request.getDropoffPostalCode()));
                shipment.setDropoffProvince(request.getDropoffProvince());
                shipment.setDropoffCity(request.getDropoffCity());
                shipment.setDropoffResidential(Boolean.TRUE.equals(request.getDropoffResidential()));
                shipment.setDropoffAddress(Shipment.composeAddress(
                        request.getDropoffLine1(), request.getDropoffLine2(),
                        request.getDropoffCity(), request.getDropoffProvince(),
                        shipment.getDropoffPostalCode()));
                Optional<GeocodingResult> geo = geocodingService.geocode(
                        request.getDropoffLine1(), request.getDropoffCity(),
                        request.getDropoffProvince(), request.getDropoffPostalCode());
                if (geo.isPresent()) {
                    shipment.setDropoffLat(geo.get().getLat());
                    shipment.setDropoffLng(geo.get().getLng());
                    shipment.setDropoffGeoAccuracy(GeocodingService.toShipmentAccuracy(geo.get().getAccuracy()));
                } else {
                    if (geoWarning == null) geoWarning = "Drop-off location could not be geocoded — map pin will be approximate.";
                    log.warn("Dropoff geocoding failed for: {}", shipment.getDropoffAddress());
                }
            } else {
                shipment.setDropoffAddress(request.getDropoffAddress());
                shipment.setDropoffLat(request.getDropoffLat());
                shipment.setDropoffLng(request.getDropoffLng());
            }

            List<Parcel> parcels = request.getParcels().stream().map(p -> {
                Parcel parcel = new Parcel();
                parcel.setWeightKg(p.getWeightKg());
                parcel.setSizeCategory(Parcel.SizeCategory.valueOf(p.getSizeCategory().toUpperCase()));
                parcel.setDescription(p.getDescription());
                parcel.setDeclaredValue(p.getDeclaredValue());
                return parcel;
            }).toList();

            Shipment created = shipmentService.createShipment(shipment, parcels);
            try {
                created = assignmentService.autoAssign(created);
            } catch (Exception assignEx) {
                log.warn("Auto-assign failed for shipment {} (will retry via scheduler): {}",
                        created.getId(), assignEx.getMessage());
            }
            List<Parcel> savedParcels = shipmentService.getParcelsForShipment(created.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("shipment", created);
            response.put("parcels", savedParcels);
            if (geoWarning != null) response.put("warning", geoWarning);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    /** Normalize a phone string to 10 digits, return original if it doesn't parse. */
    private static String normalizePhone(String raw) {
        if (raw == null) return null;
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() == 11 && digits.startsWith("1")) digits = digits.substring(1);
        return digits.length() == 10 ? digits : raw;
    }

    @PostMapping("/estimate")
    public ResponseEntity<?> estimatePrice(@RequestBody EstimateRequest request) {
        try {
            if (request.getParcels() == null || request.getParcels().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "At least one parcel is required"));
            }
            Shipment.ServiceTier tier = Shipment.ServiceTier.valueOf(
                    (request.getServiceTier() == null ? "STANDARD" : request.getServiceTier()).toUpperCase()
            );
            List<Parcel> parcels = request.getParcels().stream().map(p -> {
                Parcel parcel = new Parcel();
                parcel.setWeightKg(p.getWeightKg());
                parcel.setSizeCategory(Parcel.SizeCategory.valueOf(p.getSizeCategory().toUpperCase()));
                return parcel;
            }).toList();

            BigDecimal total = shipmentService.estimatePrice(
                    parcels, tier,
                    request.getPickupLat(), request.getPickupLng(),
                    request.getDropoffLat(), request.getDropoffLng()
            );

            double distanceKm = 0.0;
            if (request.getPickupLat() != null && request.getPickupLng() != null
                    && request.getDropoffLat() != null && request.getDropoffLng() != null) {
                distanceKm = distanceService.haversineKm(
                        request.getPickupLat(), request.getPickupLng(),
                        request.getDropoffLat(), request.getDropoffLng()
                );
            }

            Map<String, Object> body = new HashMap<>();
            body.put("priceAmount", total);
            body.put("distanceKm", Math.round(distanceKm * 100.0) / 100.0);
            return ResponseEntity.ok(body);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllShipments(HttpServletRequest httpRequest) {
        String role = extractRole(httpRequest);
        if ("CUSTOMER".equals(role)) {
            UUID customerId = currentUserId(httpRequest);
            if (customerId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Customer ID required"));
            }
            return ResponseEntity.ok(shipmentService.getCustomerShipments(customerId));
        } else if ("DRIVER".equals(role)) {
            UUID driverId = currentUserId(httpRequest);
            if (driverId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Driver ID required"));
            }
            return ResponseEntity.ok(shipmentService.getDriverShipments(driverId));
        }
        return ResponseEntity.ok(shipmentService.getAllShipments());
    }

    @GetMapping("/track/{trackingNumber}")
    public ResponseEntity<?> trackShipment(@PathVariable String trackingNumber) {
        try {
            Shipment shipment = shipmentService.getShipmentByTrackingNumber(trackingNumber);
            List<Parcel> parcels = shipmentService.getParcelsForShipment(shipment.getId());
            Map<String, Object> response = new HashMap<>();
            response.put("shipment", shipment);
            response.put("parcels", parcels);
            // Public endpoint: expose first name + vehicle type only
            if (shipment.getAssignedDriverId() != null) {
                userRepository.findById(shipment.getAssignedDriverId()).ifPresent(driver -> {
                    var dto = new com.deliveryplatform.backend.dto.DriverInfoDto(driver);
                    Map<String, Object> publicDriver = new HashMap<>();
                    publicDriver.put("firstName", dto.getFirstName());
                    publicDriver.put("vehicleType", dto.getVehicleType());
                    response.put("driver", publicDriver);
                });
            }
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shipment not found"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getShipmentById(@PathVariable UUID id, HttpServletRequest httpRequest) {
        try {
            Shipment shipment = shipmentService.getShipmentById(id);
            String role = extractRole(httpRequest);
            UUID callerId = currentUserId(httpRequest);

            if ("CUSTOMER".equals(role)) {
                if (callerId == null || !callerId.equals(shipment.getCustomerId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Customers can only view their own shipments"));
                }
            } else if ("DRIVER".equals(role)) {
                if (callerId == null || !callerId.equals(shipment.getAssignedDriverId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("message", "Drivers can only view their assigned shipments"));
                }
            }

            List<Parcel> parcels = shipmentService.getParcelsForShipment(id);
            Map<String, Object> response = new HashMap<>();
            response.put("shipment", shipment);
            response.put("parcels", parcels);
            // Authenticated view: full driver info (name, phone, vehicleType — no email/password)
            if (shipment.getAssignedDriverId() != null) {
                userRepository.findById(shipment.getAssignedDriverId()).ifPresent(driver -> {
                    response.put("driver", new com.deliveryplatform.backend.dto.DriverInfoDto(driver));
                });
            }
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> cancelShipment(@PathVariable UUID id, HttpServletRequest httpRequest) {
        try {
            UUID callerId = currentUserId(httpRequest);
            Shipment shipment = shipmentService.getShipmentById(id);
            if (callerId == null || !callerId.equals(shipment.getCustomerId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Customers can only cancel their own shipments"));
            }
            Shipment cancelled = shipmentService.cancelShipment(id);
            return ResponseEntity.ok(cancelled);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/{id}/parcels")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<?> getParcels(@PathVariable UUID id, HttpServletRequest httpRequest) {
        try {
            UUID callerId = currentUserId(httpRequest);
            String role = extractRole(httpRequest);
            if ("ADMIN".equals(role)) {
                return ResponseEntity.ok(parcelService.getParcelsForShipment(id));
            }
            if (callerId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
            }
            return ResponseEntity.ok(parcelService.listParcelsForOwner(id, callerId));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/parcels")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> addParcel(
            @PathVariable UUID id,
            @RequestBody Parcel parcel,
            HttpServletRequest httpRequest
    ) {
        try {
            UUID callerId = currentUserId(httpRequest);
            if (callerId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
            }
            Parcel saved = parcelService.addParcel(id, parcel, callerId);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalStateException ex) {
            if (ex.getMessage() != null && ex.getMessage().contains("owner")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", ex.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}/parcels/{parcelId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> deleteParcel(
            @PathVariable UUID id,
            @PathVariable UUID parcelId,
            HttpServletRequest httpRequest
    ) {
        try {
            UUID callerId = currentUserId(httpRequest);
            if (callerId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
            }
            parcelService.deleteParcel(id, parcelId, callerId);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException ex) {
            if (ex.getMessage() != null && ex.getMessage().contains("owner")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", ex.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN')")
    public ResponseEntity<?> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload,
            HttpServletRequest httpRequest
    ) {
        String statusStr = payload.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "status is required"));
        }

        try {
            String role = extractRole(httpRequest);
            Shipment.ShipmentStatus status = Shipment.ShipmentStatus.valueOf(statusStr.toUpperCase());
            UUID driverId = currentUserId(httpRequest);
            Shipment shipment = shipmentService.getShipmentById(id);
            if ("DRIVER".equals(role) && (driverId == null || !driverId.equals(shipment.getAssignedDriverId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Shipment is not assigned to this driver"));
            }
            Shipment updated = shipmentService.updateStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> autoAssignShipment(@PathVariable UUID id, HttpServletRequest httpRequest) {
        try {
            return ResponseEntity.ok(assignmentService.autoAssign(id));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignDriver(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload,
            HttpServletRequest httpRequest
    ) {
        String driverIdStr = payload.get("driverId");
        if (driverIdStr == null || driverIdStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "driverId is required"));
        }

        try {
            UUID driverId = UUID.fromString(driverIdStr);
            Shipment updated = shipmentService.assignDriver(id, driverId);
            return ResponseEntity.ok(updated);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/{id}/accept")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> acceptShipment(@PathVariable UUID id, HttpServletRequest httpRequest) {
        UUID driverId = currentUserId(httpRequest);
        if (driverId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Driver access required"));
        }
        try {
            return ResponseEntity.ok(assignmentService.accept(id, driverId));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/{id}/decline")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> declineShipment(@PathVariable UUID id, HttpServletRequest httpRequest) {
        UUID driverId = currentUserId(httpRequest);
        if (driverId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Driver access required"));
        }
        try {
            return ResponseEntity.ok(assignmentService.decline(id, driverId));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/{id}/reassign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reassignShipment(@PathVariable UUID id, HttpServletRequest httpRequest) {
        try {
            return ResponseEntity.ok(assignmentService.reassign(id));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/{id}/driverlocation")
    public ResponseEntity<?> getDriverLocation(@PathVariable UUID id) {
        try {
            return driverLocationService.getLocationForShipment(id)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("message", "No live driver location available")));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    /** @deprecated use {@code /{id}/driverlocation} */
    @Deprecated
    @GetMapping("/{id}/driver-location")
    public ResponseEntity<?> getDriverLocationAlias(@PathVariable UUID id) {
        return getDriverLocation(id);
    }

    private String extractRole(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String role = jwtUtil.extractRole(authHeader.substring(7));
                if (role != null) {
                    if (role.startsWith("ROLE_")) {
                        role = role.substring(5);
                    }
                    return role.toUpperCase();
                }
            } catch (Exception ignored) {
            }
        }
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities() != null) {
            for (var authority : auth.getAuthorities()) {
                String authStr = authority.getAuthority();
                if (authStr.startsWith("ROLE_")) {
                    return authStr.substring(5).toUpperCase();
                }
            }
        }
        return null;
    }

    private UUID currentUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                UUID userId = jwtUtil.extractUserId(token);
                if (userId != null) {
                    return userId;
                }
                String email = jwtUtil.extractEmail(token);
                return userRepository.findByEmail(email).map(User::getId).orElse(null);
            } catch (Exception ex) {
                return null;
            }
        }
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            try {
                return userRepository.findByEmail(auth.getName()).map(User::getId).orElse(null);
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private boolean isAdminOrSystem(HttpServletRequest request) {
        if ("true".equalsIgnoreCase(request.getHeader("X-System-Request"))) {
            return true;
        }
        return "ADMIN".equals(extractRole(request));
    }

    public static class CreateShipmentRequest {
        private UUID customerId;
        // Legacy free-text (still accepted for backward compat and tests)
        private String pickupAddress;
        private Double pickupLat;
        private Double pickupLng;
        private String recipientName;
        private String recipientPhone;
        private String dropoffAddress;
        private Double dropoffLat;
        private Double dropoffLng;
        private String serviceTier;
        @Valid
        @NotEmpty(message = "At least one parcel is required")
        private java.util.List<ParcelRequest> parcels;

        // Structured pickup
        private String pickupContactName;
        private String pickupCompany;
        private String pickupPhone;
        private String pickupEmail;
        private String pickupLine1;
        private String pickupLine2;
        private String pickupPostalCode;
        private String pickupProvince;
        private String pickupCity;
        private Boolean pickupResidential;

        // Structured drop-off
        private String dropoffContactName;
        private String dropoffCompany;
        private String dropoffPhone;
        private String dropoffEmail;
        private String dropoffLine1;
        private String dropoffLine2;
        private String dropoffPostalCode;
        private String dropoffProvince;
        private String dropoffCity;
        private Boolean dropoffResidential;

        public UUID getCustomerId() { return customerId; }
        public void setCustomerId(UUID v) { this.customerId = v; }
        public String getPickupAddress() { return pickupAddress; }
        public void setPickupAddress(String v) { this.pickupAddress = v; }
        public Double getPickupLat() { return pickupLat; }
        public void setPickupLat(Double v) { this.pickupLat = v; }
        public Double getPickupLng() { return pickupLng; }
        public void setPickupLng(Double v) { this.pickupLng = v; }
        public String getRecipientName() { return recipientName; }
        public void setRecipientName(String v) { this.recipientName = v; }
        public String getRecipientPhone() { return recipientPhone; }
        public void setRecipientPhone(String v) { this.recipientPhone = v; }
        public String getDropoffAddress() { return dropoffAddress; }
        public void setDropoffAddress(String v) { this.dropoffAddress = v; }
        public Double getDropoffLat() { return dropoffLat; }
        public void setDropoffLat(Double v) { this.dropoffLat = v; }
        public Double getDropoffLng() { return dropoffLng; }
        public void setDropoffLng(Double v) { this.dropoffLng = v; }
        public String getServiceTier() { return serviceTier; }
        public void setServiceTier(String v) { this.serviceTier = v; }
        public java.util.List<ParcelRequest> getParcels() { return parcels; }
        public void setParcels(java.util.List<ParcelRequest> v) { this.parcels = v; }
        public String getPickupContactName() { return pickupContactName; }
        public void setPickupContactName(String v) { this.pickupContactName = v; }
        public String getPickupCompany() { return pickupCompany; }
        public void setPickupCompany(String v) { this.pickupCompany = v; }
        public String getPickupPhone() { return pickupPhone; }
        public void setPickupPhone(String v) { this.pickupPhone = v; }
        public String getPickupEmail() { return pickupEmail; }
        public void setPickupEmail(String v) { this.pickupEmail = v; }
        public String getPickupLine1() { return pickupLine1; }
        public void setPickupLine1(String v) { this.pickupLine1 = v; }
        public String getPickupLine2() { return pickupLine2; }
        public void setPickupLine2(String v) { this.pickupLine2 = v; }
        public String getPickupPostalCode() { return pickupPostalCode; }
        public void setPickupPostalCode(String v) { this.pickupPostalCode = v; }
        public String getPickupProvince() { return pickupProvince; }
        public void setPickupProvince(String v) { this.pickupProvince = v; }
        public String getPickupCity() { return pickupCity; }
        public void setPickupCity(String v) { this.pickupCity = v; }
        public Boolean getPickupResidential() { return pickupResidential; }
        public void setPickupResidential(Boolean v) { this.pickupResidential = v; }
        public String getDropoffContactName() { return dropoffContactName; }
        public void setDropoffContactName(String v) { this.dropoffContactName = v; }
        public String getDropoffCompany() { return dropoffCompany; }
        public void setDropoffCompany(String v) { this.dropoffCompany = v; }
        public String getDropoffPhone() { return dropoffPhone; }
        public void setDropoffPhone(String v) { this.dropoffPhone = v; }
        public String getDropoffEmail() { return dropoffEmail; }
        public void setDropoffEmail(String v) { this.dropoffEmail = v; }
        public String getDropoffLine1() { return dropoffLine1; }
        public void setDropoffLine1(String v) { this.dropoffLine1 = v; }
        public String getDropoffLine2() { return dropoffLine2; }
        public void setDropoffLine2(String v) { this.dropoffLine2 = v; }
        public String getDropoffPostalCode() { return dropoffPostalCode; }
        public void setDropoffPostalCode(String v) { this.dropoffPostalCode = v; }
        public String getDropoffProvince() { return dropoffProvince; }
        public void setDropoffProvince(String v) { this.dropoffProvince = v; }
        public String getDropoffCity() { return dropoffCity; }
        public void setDropoffCity(String v) { this.dropoffCity = v; }
        public Boolean getDropoffResidential() { return dropoffResidential; }
        public void setDropoffResidential(Boolean v) { this.dropoffResidential = v; }
    }

    public static class EstimateRequest {
        private String serviceTier;
        private Double pickupLat;
        private Double pickupLng;
        private Double dropoffLat;
        private Double dropoffLng;
        private List<ParcelRequest> parcels;

        public String getServiceTier() { return serviceTier; }
        public void setServiceTier(String serviceTier) { this.serviceTier = serviceTier; }
        public Double getPickupLat() { return pickupLat; }
        public void setPickupLat(Double pickupLat) { this.pickupLat = pickupLat; }
        public Double getPickupLng() { return pickupLng; }
        public void setPickupLng(Double pickupLng) { this.pickupLng = pickupLng; }
        public Double getDropoffLat() { return dropoffLat; }
        public void setDropoffLat(Double dropoffLat) { this.dropoffLat = dropoffLat; }
        public Double getDropoffLng() { return dropoffLng; }
        public void setDropoffLng(Double dropoffLng) { this.dropoffLng = dropoffLng; }
        public List<ParcelRequest> getParcels() { return parcels; }
        public void setParcels(List<ParcelRequest> parcels) { this.parcels = parcels; }
    }

    public static class ParcelRequest {
        @NotNull(message = "Weight is required")
        @DecimalMin(value = "0.1", message = "Weight must be at least 0.1 kg")
        @DecimalMax(value = "50.0", message = "Weight must be at most 50 kg")
        private BigDecimal weightKg;

        @NotBlank(message = "Size category is required")
        @Pattern(regexp = "SMALL|MEDIUM|LARGE", message = "Size must be SMALL, MEDIUM or LARGE")
        private String sizeCategory;

        @NotBlank(message = "Description is required")
        @Size(max = 200, message = "Description must be at most 200 characters")
        private String description;

        @DecimalMin(value = "0.0", message = "Declared value must be 0 or more")
        @DecimalMax(value = "10000.0", message = "Declared value must be at most 10,000 CAD")
        private BigDecimal declaredValue;

        public BigDecimal getWeightKg() { return weightKg; }
        public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }
        public String getSizeCategory() { return sizeCategory; }
        public void setSizeCategory(String sizeCategory) { this.sizeCategory = sizeCategory; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getDeclaredValue() { return declaredValue; }
        public void setDeclaredValue(BigDecimal declaredValue) { this.declaredValue = declaredValue; }
    }
}

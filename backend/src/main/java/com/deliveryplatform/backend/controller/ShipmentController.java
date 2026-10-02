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
import jakarta.servlet.http.HttpServletRequest;
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

    public ShipmentController(
            ShipmentService shipmentService,
            ParcelService parcelService,
            JwtUtil jwtUtil,
            AssignmentService assignmentService,
            DriverLocationService driverLocationService,
            UserRepository userRepository,
            DistanceService distanceService
    ) {
        this.shipmentService = shipmentService;
        this.parcelService = parcelService;
        this.jwtUtil = jwtUtil;
        this.assignmentService = assignmentService;
        this.driverLocationService = driverLocationService;
        this.userRepository = userRepository;
        this.distanceService = distanceService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createShipment(
            @RequestBody CreateShipmentRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            UUID callerId = currentUserId(httpRequest);
            if (callerId != null && request.getCustomerId() == null) {
                request.setCustomerId(callerId);
            }
            Shipment shipment = new Shipment();
            shipment.setCustomerId(request.getCustomerId());
            shipment.setPickupAddress(request.getPickupAddress());
            shipment.setPickupLat(request.getPickupLat());
            shipment.setPickupLng(request.getPickupLng());
            shipment.setRecipientName(request.getRecipientName());
            shipment.setRecipientPhone(request.getRecipientPhone());
            shipment.setDropoffAddress(request.getDropoffAddress());
            shipment.setDropoffLat(request.getDropoffLat());
            shipment.setDropoffLng(request.getDropoffLng());
            shipment.setServiceTier(Shipment.ServiceTier.valueOf(request.getServiceTier().toUpperCase()));

            List<Parcel> parcels = request.getParcels().stream().map(p -> {
                Parcel parcel = new Parcel();
                parcel.setWeightKg(p.getWeightKg());
                parcel.setSizeCategory(Parcel.SizeCategory.valueOf(p.getSizeCategory().toUpperCase()));
                parcel.setDescription(p.getDescription());
                parcel.setDeclaredValue(p.getDeclaredValue());
                return parcel;
            }).toList();

            Shipment created = shipmentService.createShipment(shipment, parcels);
            // Auto-assign is best-effort; if it fails (e.g. no Redis) the scheduler will retry
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
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
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
        private String pickupAddress;
        private Double pickupLat;
        private Double pickupLng;
        private String recipientName;
        private String recipientPhone;
        private String dropoffAddress;
        private Double dropoffLat;
        private Double dropoffLng;
        private String serviceTier;
        private List<ParcelRequest> parcels;

        public UUID getCustomerId() { return customerId; }
        public void setCustomerId(UUID customerId) { this.customerId = customerId; }
        public String getPickupAddress() { return pickupAddress; }
        public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
        public Double getPickupLat() { return pickupLat; }
        public void setPickupLat(Double pickupLat) { this.pickupLat = pickupLat; }
        public Double getPickupLng() { return pickupLng; }
        public void setPickupLng(Double pickupLng) { this.pickupLng = pickupLng; }
        public String getRecipientName() { return recipientName; }
        public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
        public String getRecipientPhone() { return recipientPhone; }
        public void setRecipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; }
        public String getDropoffAddress() { return dropoffAddress; }
        public void setDropoffAddress(String dropoffAddress) { this.dropoffAddress = dropoffAddress; }
        public Double getDropoffLat() { return dropoffLat; }
        public void setDropoffLat(Double dropoffLat) { this.dropoffLat = dropoffLat; }
        public Double getDropoffLng() { return dropoffLng; }
        public void setDropoffLng(Double dropoffLng) { this.dropoffLng = dropoffLng; }
        public String getServiceTier() { return serviceTier; }
        public void setServiceTier(String serviceTier) { this.serviceTier = serviceTier; }
        public List<ParcelRequest> getParcels() { return parcels; }
        public void setParcels(List<ParcelRequest> parcels) { this.parcels = parcels; }
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
        private BigDecimal weightKg;
        private String sizeCategory;
        private String description;
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

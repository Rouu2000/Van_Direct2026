package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.DeliveryEvent;
import com.deliveryplatform.backend.model.DriverStatus;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.DriverStatusRepository;
import com.deliveryplatform.backend.repository.ShipmentRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class AssignmentService {

    private static final Logger log = LoggerFactory.getLogger(AssignmentService.class);

    private final ShipmentRepository shipmentRepository;
    private final DriverStatusRepository driverStatusRepository;
    private final DeliveryEventService deliveryEventService;
    private final UserRepository userRepository;
    private final DriverLocationService driverLocationService;
    private final DistanceService distanceService;
    private final NotificationService notificationService;
    private final long offerTimeoutSeconds;

    @org.springframework.beans.factory.annotation.Autowired
    public AssignmentService(
            ShipmentRepository shipmentRepository,
            DriverStatusRepository driverStatusRepository,
            DeliveryEventService deliveryEventService,
            UserRepository userRepository,
            DriverLocationService driverLocationService,
            DistanceService distanceService,
            NotificationService notificationService,
            @Value("${assignment.offer-timeout-seconds:30}") long offerTimeoutSeconds
    ) {
        this.shipmentRepository = shipmentRepository;
        this.driverStatusRepository = driverStatusRepository;
        this.deliveryEventService = deliveryEventService;
        this.userRepository = userRepository;
        this.driverLocationService = driverLocationService;
        this.distanceService = distanceService;
        this.notificationService = notificationService;
        this.offerTimeoutSeconds = offerTimeoutSeconds;
    }

    public AssignmentService(
            ShipmentRepository shipmentRepository,
            DriverStatusRepository driverStatusRepository,
            DeliveryEventService deliveryEventService,
            UserRepository userRepository,
            DriverLocationService driverLocationService,
            DistanceService distanceService,
            long offerTimeoutSeconds
    ) {
        this(shipmentRepository, driverStatusRepository, deliveryEventService, userRepository,
                driverLocationService, distanceService, null, offerTimeoutSeconds);
    }

    public DriverStatus findNearestDriver(Shipment shipment) {
        Double pickupLat = shipment.getPickupLat();
        Double pickupLng = shipment.getPickupLng();
        if (pickupLat == null || pickupLng == null) {
            return null;
        }

        Set<UUID> excluded = shipment.getExcludedDriverIds() != null
                ? shipment.getExcludedDriverIds()
                : Set.of();

        List<DriverStatus> available = driverStatusRepository.findByStatus(DriverStatus.Status.AVAILABLE);
        return available.stream()
                .filter(ds -> !excluded.contains(ds.getDriverId()))
                .filter(ds -> {
                    User driver = userRepository.findById(ds.getDriverId()).orElse(null);
                    return driver != null
                            && driver.getRole() == User.Role.DRIVER
                            && driver.getStatus() == User.Status.ACTIVE;
                })
                .map(ds -> {
                    Optional<Map<String, Object>> location = driverLocationService.getLocation(ds.getDriverId());
                    if (location.isEmpty()) {
                        return null;
                    }
                    Double lat = toDouble(location.get().get("lat"));
                    Double lng = toDouble(location.get().get("lng"));
                    if (lat == null || lng == null) {
                        return null;
                    }
                    double distance = distanceService.haversineKm(pickupLat, pickupLng, lat, lng);
                    return new DriverDistance(ds, distance);
                })
                .filter(dd -> dd != null)
                .min(Comparator.comparingDouble(DriverDistance::distance))
                .map(DriverDistance::driverStatus)
                .orElse(null);
    }

    @Transactional
    public Shipment autoAssign(UUID shipmentId) {
        return autoAssign(shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found")), DeliveryEvent.EventType.ASSIGNED);
    }

    @Transactional
    public Shipment autoAssign(Shipment shipment) {
        return autoAssign(shipment, DeliveryEvent.EventType.ASSIGNED);
    }

    @Transactional
    public Shipment reassign(UUID shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
        UUID previousDriver = shipment.getAssignedDriverId();
        if (previousDriver != null) {
            if (shipment.getExcludedDriverIds() == null) {
                shipment.setExcludedDriverIds(new HashSet<>());
            }
            shipment.getExcludedDriverIds().add(previousDriver);
            driverStatusRepository.findByDriverId(previousDriver).ifPresent(status -> {
                status.setStatus(DriverStatus.Status.AVAILABLE);
                driverStatusRepository.save(status);
            });
        }
        shipment.setAssignedDriverId(null);
        shipment.setOfferExpiresAt(null);
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);
        shipmentRepository.save(shipment);
        return autoAssign(shipment, DeliveryEvent.EventType.REASSIGNED);
    }

    @Transactional
    public Shipment accept(UUID shipmentId, UUID driverId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
        if (!driverId.equals(shipment.getAssignedDriverId())) {
            throw new RuntimeException("Shipment is not assigned to this driver");
        }
        if (shipment.getStatus() != Shipment.ShipmentStatus.DRIVER_ASSIGNED) {
            throw new RuntimeException("Only assigned shipments can be accepted");
        }

        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found"));
        if (driver.getRole() != User.Role.DRIVER || driver.getStatus() != User.Status.ACTIVE) {
            throw new IllegalStateException("Driver is not active");
        }

        DriverStatus status = driverStatusRepository.findByDriverId(driverId)
                .orElseGet(() -> {
                    DriverStatus created = new DriverStatus();
                    created.setDriverId(driverId);
                    return created;
                });
        status.setStatus(DriverStatus.Status.ON_DELIVERY);
        driverStatusRepository.save(status);
        shipment.setOfferExpiresAt(null);
        shipmentRepository.save(shipment);
        deliveryEventService.record(shipmentId, driverId, DeliveryEvent.EventType.ACCEPTED);
        return shipment;
    }

    @Transactional
    public Shipment decline(UUID shipmentId, UUID driverId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
        if (!driverId.equals(shipment.getAssignedDriverId())) {
            throw new RuntimeException("Shipment is not assigned to this driver");
        }
        if (shipment.getStatus() != Shipment.ShipmentStatus.DRIVER_ASSIGNED) {
            throw new RuntimeException("Only assigned shipments can be declined");
        }

        driverStatusRepository.findByDriverId(driverId).ifPresent(status -> {
            status.setStatus(DriverStatus.Status.OFFLINE);
            driverStatusRepository.save(status);
        });

        if (shipment.getExcludedDriverIds() == null) {
            shipment.setExcludedDriverIds(new HashSet<>());
        }
        shipment.getExcludedDriverIds().add(driverId);
        shipment.setAssignedDriverId(null);
        shipment.setOfferExpiresAt(null);
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);
        Shipment saved = shipmentRepository.save(shipment);
        deliveryEventService.record(shipmentId, driverId, DeliveryEvent.EventType.REASSIGNED);
        return autoAssign(saved, DeliveryEvent.EventType.REASSIGNED);
    }

    @Scheduled(fixedRate = 5000)
    @Transactional
    public void processExpiredOffersAndUnassigned() {
        try {
            LocalDateTime now = LocalDateTime.now();

            List<Shipment> expired = shipmentRepository
                    .findByStatusAndOfferExpiresAtBefore(Shipment.ShipmentStatus.DRIVER_ASSIGNED, now);
            for (Shipment shipment : expired) {
                handleExpiredOffer(shipment);
            }

            List<Shipment> unassigned = shipmentRepository.findByStatus(Shipment.ShipmentStatus.BOOKED);
            for (Shipment shipment : unassigned) {
                if (shipment.getAssignedDriverId() == null) {
                    autoAssign(shipment, DeliveryEvent.EventType.ASSIGNED);
                }
            }
        } catch (Exception ex) {
            log.warn("Assignment scheduler tick failed (will retry): {}", ex.getMessage());
        }
    }

    private void handleExpiredOffer(Shipment shipment) {
        UUID previousDriver = shipment.getAssignedDriverId();
        if (previousDriver != null) {
            deliveryEventService.record(shipment.getId(), previousDriver, DeliveryEvent.EventType.REASSIGNED);
            driverStatusRepository.findByDriverId(previousDriver).ifPresent(status -> {
                status.setStatus(DriverStatus.Status.AVAILABLE);
                driverStatusRepository.save(status);
            });
            if (shipment.getExcludedDriverIds() == null) {
                shipment.setExcludedDriverIds(new HashSet<>());
            }
            shipment.getExcludedDriverIds().add(previousDriver);
        }
        shipment.setAssignedDriverId(null);
        shipment.setOfferExpiresAt(null);
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);
        shipmentRepository.save(shipment);
        autoAssign(shipment, DeliveryEvent.EventType.REASSIGNED);
    }

    private Shipment autoAssign(Shipment shipment, DeliveryEvent.EventType eventType) {
        if (shipment.getStatus() == Shipment.ShipmentStatus.CANCELLED
                || shipment.getStatus() == Shipment.ShipmentStatus.DELIVERED) {
            throw new RuntimeException("Cannot assign a cancelled or delivered shipment");
        }

        DriverStatus driver = findNearestDriver(shipment);
        if (driver == null) {
            log.info("No available driver found for shipment {}; keeping BOOKED for later retry", shipment.getId());
            shipment.setAssignedDriverId(null);
            shipment.setOfferExpiresAt(null);
            if (shipment.getStatus() != Shipment.ShipmentStatus.BOOKED) {
                shipment.setStatus(Shipment.ShipmentStatus.BOOKED);
            }
            return shipmentRepository.save(shipment);
        }

        shipment.setAssignedDriverId(driver.getDriverId());
        shipment.setStatus(Shipment.ShipmentStatus.DRIVER_ASSIGNED);
        shipment.setOfferExpiresAt(LocalDateTime.now().plusSeconds(offerTimeoutSeconds));
        Shipment saved = shipmentRepository.save(shipment);
        deliveryEventService.record(saved.getId(), driver.getDriverId(), eventType);
        if (notificationService != null) {
            notificationService.notifyShipmentStatusChange(saved);
        }
        log.info("Shipment {} offered to driver {} until {}",
                saved.getId(), driver.getDriverId(), saved.getOfferExpiresAt());
        return saved;
    }

    private static Double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value instanceof String str && !str.isBlank()) {
            try {
                return Double.parseDouble(str);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private record DriverDistance(DriverStatus driverStatus, double distance) {}
}

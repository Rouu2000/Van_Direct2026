package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.dto.CustomerShipmentDto;
import com.deliveryplatform.backend.model.Parcel;
import com.deliveryplatform.backend.model.DeliveryEvent;
import com.deliveryplatform.backend.model.DriverStatus;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.DriverStatusRepository;
import com.deliveryplatform.backend.repository.ParcelRepository;
import com.deliveryplatform.backend.repository.ShipmentRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final ParcelRepository parcelRepository;
    private final PriceCalculator priceCalculator;
    private final DriverStatusRepository driverStatusRepository;
    private final DeliveryEventService deliveryEventService;
    private final UserRepository userRepository;
    private final DistanceService distanceService;
    private final NotificationService notificationService;

    @Value("${assignment.offer-timeout-seconds:30}")
    private long offerTimeoutSeconds;

    public ShipmentService(
            ShipmentRepository shipmentRepository,
            ParcelRepository parcelRepository,
            PriceCalculator priceCalculator,
            DriverStatusRepository driverStatusRepository,
            DeliveryEventService deliveryEventService,
            UserRepository userRepository,
            DistanceService distanceService,
            NotificationService notificationService
    ) {
        this.shipmentRepository = shipmentRepository;
        this.parcelRepository = parcelRepository;
        this.priceCalculator = priceCalculator;
        this.driverStatusRepository = driverStatusRepository;
        this.deliveryEventService = deliveryEventService;
        this.userRepository = userRepository;
        this.distanceService = distanceService;
        this.notificationService = notificationService;
        this.offerTimeoutSeconds = 30; // default; overridden by @Value in Spring context
    }

    @Transactional
    public Shipment createShipment(Shipment shipment, List<Parcel> parcels) {
        if (parcels == null || parcels.isEmpty()) {
            throw new RuntimeException("At least one parcel is required");
        }
        if (shipment.getServiceTier() == null) {
            shipment.setServiceTier(Shipment.ServiceTier.STANDARD);
        }

        shipment.setTrackingNumber(Shipment.generateTrackingNumber());
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);
        shipment.setCreatedAt(LocalDateTime.now());

        double distanceKm = resolveDistanceKm(
                shipment.getPickupLat(), shipment.getPickupLng(),
                shipment.getDropoffLat(), shipment.getDropoffLng()
        );
        BigDecimal total = priceCalculator.calculateTotalShipment(parcels, shipment.getServiceTier(), distanceKm);
        shipment.setPriceAmount(total);

        Shipment saved = shipmentRepository.save(shipment);

        for (Parcel parcel : parcels) {
            parcel.setId(null);
            parcel.setShipmentId(saved.getId());
            parcelRepository.save(parcel);
        }

        return saved;
    }

    public BigDecimal estimatePrice(List<Parcel> parcels, Shipment.ServiceTier tier,
                                    Double pickupLat, Double pickupLng,
                                    Double dropoffLat, Double dropoffLng) {
        double distanceKm = resolveDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
        return priceCalculator.calculateTotalShipment(parcels, tier, distanceKm);
    }

    private double resolveDistanceKm(Double pickupLat, Double pickupLng, Double dropoffLat, Double dropoffLng) {
        if (pickupLat == null || pickupLng == null || dropoffLat == null || dropoffLng == null) {
            return 0.0;
        }
        return distanceService.haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
    }

    public Shipment getShipmentById(UUID id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
    }

    public Shipment getShipmentByTrackingNumber(String trackingNumber) {
        return shipmentRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
    }

    public List<Shipment> getCustomerShipments(UUID customerId) {
        return shipmentRepository.findByCustomerId(customerId);
    }

    public List<CustomerShipmentDto> getCustomerShipmentDtos(UUID customerId) {
        return shipmentRepository.findByCustomerId(customerId).stream()
                .map(s -> CustomerShipmentDto.from(s, parcelRepository.findByShipmentId(s.getId()).size()))
                .toList();
    }

    public List<Shipment> getDriverShipments(UUID driverId) {
        return shipmentRepository.findByAssignedDriverIdAndStatusIn(
                driverId,
                List.of(Shipment.ShipmentStatus.DRIVER_ASSIGNED, Shipment.ShipmentStatus.PICKED_UP)
        );
    }

    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }

    public List<Parcel> getParcelsForShipment(UUID shipmentId) {
        return parcelRepository.findByShipmentId(shipmentId);
    }

    @Transactional
    public Shipment cancelShipment(UUID id) {
        Shipment shipment = getShipmentById(id);

        if (shipment.getStatus() != Shipment.ShipmentStatus.BOOKED
                && shipment.getStatus() != Shipment.ShipmentStatus.DRIVER_ASSIGNED) {
            throw new IllegalStateException("Shipment can only be cancelled while BOOKED or DRIVER_ASSIGNED. Current status: " + shipment.getStatus());
        }

        shipment.setStatus(Shipment.ShipmentStatus.CANCELLED);
        Shipment saved = shipmentRepository.save(shipment);
        notificationService.notifyShipmentStatusChange(saved);
        return saved;
    }

    @Transactional
    public Shipment updateStatus(UUID id, Shipment.ShipmentStatus status) {
        Shipment shipment = getShipmentById(id);
        Shipment.ShipmentStatus currentStatus = shipment.getStatus();

        if (status == null) {
            throw new IllegalArgumentException("Target status cannot be null");
        }

        switch (status) {
            case DRIVER_ASSIGNED -> {
                if (currentStatus != Shipment.ShipmentStatus.BOOKED) {
                    throw new IllegalStateException("Cannot transition to DRIVER_ASSIGNED from " + currentStatus + ". Shipment must be BOOKED.");
                }
            }
            case PICKED_UP -> {
                if (currentStatus != Shipment.ShipmentStatus.DRIVER_ASSIGNED) {
                    throw new IllegalStateException("Cannot transition to PICKED_UP from " + currentStatus + ". Shipment must be DRIVER_ASSIGNED.");
                }
                if (shipment.getAssignedDriverId() == null) {
                    throw new IllegalStateException("Shipment has no assigned driver");
                }
                // offerExpiresAt is cleared by accept(); if it is still set the offer has not been accepted
                if (shipment.getOfferExpiresAt() != null) {
                    throw new IllegalStateException("Driver must accept the shipment offer before marking it as PICKED_UP.");
                }
            }
            case DELIVERED -> {
                if (currentStatus != Shipment.ShipmentStatus.PICKED_UP) {
                    throw new IllegalStateException("Cannot transition to DELIVERED from " + currentStatus + ". Shipment must be PICKED_UP.");
                }
                if (shipment.getAssignedDriverId() == null) {
                    throw new IllegalStateException("Shipment has no assigned driver");
                }
            }
            case CANCELLED -> {
                if (currentStatus != Shipment.ShipmentStatus.BOOKED
                        && currentStatus != Shipment.ShipmentStatus.DRIVER_ASSIGNED) {
                    throw new IllegalStateException("Cannot transition to CANCELLED from " + currentStatus + ". Shipment must be BOOKED or DRIVER_ASSIGNED.");
                }
            }
            default -> throw new IllegalArgumentException("Invalid status transition from " + currentStatus + " to " + status + ".");
        }

        UUID driverId = shipment.getAssignedDriverId();
        shipment.setStatus(status);

        if (status == Shipment.ShipmentStatus.DELIVERED) {
            shipment.setDeliveredAt(LocalDateTime.now());
            if (driverId != null) {
                deliveryEventService.record(id, driverId, DeliveryEvent.EventType.DELIVERED);
                // Only free the driver if they have no other active shipments
                long remaining = shipmentRepository.countByAssignedDriverIdAndStatusIn(
                        driverId,
                        List.of(Shipment.ShipmentStatus.DRIVER_ASSIGNED, Shipment.ShipmentStatus.PICKED_UP)
                );
                // remaining > 0 means another active shipment still exists (before this save)
                // After save this shipment will be DELIVERED so subtract 1
                if (remaining <= 1) {
                    driverStatusRepository.findByDriverId(driverId).ifPresent(driverStatus -> {
                        driverStatus.setStatus(DriverStatus.Status.AVAILABLE);
                        driverStatusRepository.save(driverStatus);
                    });
                }
            }
        } else if (status == Shipment.ShipmentStatus.PICKED_UP) {
            if (driverId != null) {
                deliveryEventService.record(id, driverId, DeliveryEvent.EventType.PICKED_UP);
            }
        } else if (status == Shipment.ShipmentStatus.DRIVER_ASSIGNED) {
            if (driverId != null) {
                deliveryEventService.record(id, driverId, DeliveryEvent.EventType.ASSIGNED);
            }
        } else if (status == Shipment.ShipmentStatus.CANCELLED) {
            if (driverId != null) {
                // Only free the driver if they have no other active shipments
                long remaining = shipmentRepository.countByAssignedDriverIdAndStatusIn(
                        driverId,
                        List.of(Shipment.ShipmentStatus.DRIVER_ASSIGNED, Shipment.ShipmentStatus.PICKED_UP)
                );
                if (remaining <= 1) {
                    driverStatusRepository.findByDriverId(driverId).ifPresent(driverStatus -> {
                        driverStatus.setStatus(DriverStatus.Status.AVAILABLE);
                        driverStatusRepository.save(driverStatus);
                    });
                }
            }
        }

        Shipment saved = shipmentRepository.save(shipment);
        notificationService.notifyShipmentStatusChange(saved);
        return saved;
    }

    @Transactional
    public Shipment assignDriver(UUID shipmentId, UUID driverId) {
        Shipment shipment = getShipmentById(shipmentId);

        if (shipment.getStatus() != Shipment.ShipmentStatus.BOOKED) {
            throw new IllegalStateException("Cannot assign driver unless shipment status is BOOKED. Current status: " + shipment.getStatus());
        }

        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found"));
        if (driver.getRole() != User.Role.DRIVER || driver.getStatus() != User.Status.ACTIVE) {
            throw new IllegalStateException("Driver must be an ACTIVE driver");
        }

        shipment.setAssignedDriverId(driverId);
        shipment.setStatus(Shipment.ShipmentStatus.DRIVER_ASSIGNED);
        // Set offerExpiresAt so the driver must explicitly accept before marking PICKED_UP
        shipment.setOfferExpiresAt(java.time.LocalDateTime.now().plusSeconds(offerTimeoutSeconds));
        Shipment saved = shipmentRepository.save(shipment);
        deliveryEventService.record(shipmentId, driverId, DeliveryEvent.EventType.ASSIGNED);
        notificationService.notifyShipmentStatusChange(saved);
        return saved;
    }
}

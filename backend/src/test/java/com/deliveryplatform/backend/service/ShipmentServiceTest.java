package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.DriverStatus;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.DriverStatusRepository;
import com.deliveryplatform.backend.repository.ParcelRepository;
import com.deliveryplatform.backend.repository.ShipmentRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ShipmentServiceTest {

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private ParcelRepository parcelRepository;

    @Mock
    private PriceCalculator priceCalculator;

    @Mock
    private DriverStatusRepository driverStatusRepository;

    @Mock
    private DeliveryEventService deliveryEventService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DistanceService distanceService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ShipmentService shipmentService;

    private UUID shipmentId;
    private UUID driverId;
    private Shipment shipment;

    @BeforeEach
    void setUp() {
        shipmentId = UUID.randomUUID();
        driverId = UUID.randomUUID();

        shipment = new Shipment();
        shipment.setId(shipmentId);
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);
        shipment.setAssignedDriverId(driverId);

        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));
        lenient().when(shipmentRepository.save(any(Shipment.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    // 1. Invalid status transitions rejected
    @Test
    void bookedCannotTransitionToPickedUp() {
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                shipmentService.updateStatus(shipmentId, Shipment.ShipmentStatus.PICKED_UP));
        assertTrue(ex.getMessage().contains("Cannot transition to PICKED_UP"));
    }

    @Test
    void bookedCannotTransitionToDelivered() {
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                shipmentService.updateStatus(shipmentId, Shipment.ShipmentStatus.DELIVERED));
        assertTrue(ex.getMessage().contains("Cannot transition to DELIVERED"));
    }

    @Test
    void pickedUpCannotTransitionToBooked() {
        shipment.setStatus(Shipment.ShipmentStatus.PICKED_UP);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                shipmentService.updateStatus(shipmentId, Shipment.ShipmentStatus.BOOKED));
        assertTrue(ex.getMessage().contains("Invalid status transition"));
    }

    @Test
    void pickedUpCannotTransitionToCancelled() {
        shipment.setStatus(Shipment.ShipmentStatus.PICKED_UP);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                shipmentService.updateStatus(shipmentId, Shipment.ShipmentStatus.CANCELLED));
        assertTrue(ex.getMessage().contains("Cannot transition to CANCELLED"));
    }

    @Test
    void deliveredCannotTransitionToCancelled() {
        shipment.setStatus(Shipment.ShipmentStatus.DELIVERED);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                shipmentService.updateStatus(shipmentId, Shipment.ShipmentStatus.CANCELLED));
        assertTrue(ex.getMessage().contains("Cannot transition to CANCELLED"));
    }

    @Test
    void cancelledCannotTransitionToDelivered() {
        shipment.setStatus(Shipment.ShipmentStatus.CANCELLED);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                shipmentService.updateStatus(shipmentId, Shipment.ShipmentStatus.DELIVERED));
        assertTrue(ex.getMessage().contains("Cannot transition to DELIVERED"));
    }

    // Valid state transitions
    @Test
    void validStateMachineTransitionsSucceed() {
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);

        Shipment assigned = shipmentService.updateStatus(shipmentId, Shipment.ShipmentStatus.DRIVER_ASSIGNED);
        assertEquals(Shipment.ShipmentStatus.DRIVER_ASSIGNED, assigned.getStatus());

        Shipment pickedUp = shipmentService.updateStatus(shipmentId, Shipment.ShipmentStatus.PICKED_UP);
        assertEquals(Shipment.ShipmentStatus.PICKED_UP, pickedUp.getStatus());

        Shipment delivered = shipmentService.updateStatus(shipmentId, Shipment.ShipmentStatus.DELIVERED);
        assertEquals(Shipment.ShipmentStatus.DELIVERED, delivered.getStatus());
        assertNotNull(delivered.getDeliveredAt());
    }

    @Test
    void cancellationOnlyFromBookedOrDriverAssigned() {
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);
        Shipment cancelled1 = shipmentService.updateStatus(shipmentId, Shipment.ShipmentStatus.CANCELLED);
        assertEquals(Shipment.ShipmentStatus.CANCELLED, cancelled1.getStatus());

        shipment.setStatus(Shipment.ShipmentStatus.DRIVER_ASSIGNED);
        Shipment cancelled2 = shipmentService.updateStatus(shipmentId, Shipment.ShipmentStatus.CANCELLED);
        assertEquals(Shipment.ShipmentStatus.CANCELLED, cancelled2.getStatus());
    }

    // 2. Pending or suspended driver cannot be assigned
    @Test
    void pendingDriverCannotBeAssigned() {
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);

        User pendingDriver = new User();
        pendingDriver.setId(driverId);
        pendingDriver.setRole(User.Role.DRIVER);
        pendingDriver.setStatus(User.Status.PENDING_APPROVAL);

        when(userRepository.findById(driverId)).thenReturn(Optional.of(pendingDriver));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                shipmentService.assignDriver(shipmentId, driverId));
        assertTrue(ex.getMessage().contains("Driver must be an ACTIVE driver"));
    }

    @Test
    void suspendedDriverCannotBeAssigned() {
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);

        User suspendedDriver = new User();
        suspendedDriver.setId(driverId);
        suspendedDriver.setRole(User.Role.DRIVER);
        suspendedDriver.setStatus(User.Status.SUSPENDED);

        when(userRepository.findById(driverId)).thenReturn(Optional.of(suspendedDriver));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                shipmentService.assignDriver(shipmentId, driverId));
        assertTrue(ex.getMessage().contains("Driver must be an ACTIVE driver"));
    }

    @Test
    void assignDriverBlockedUnlessStatusIsBooked() {
        shipment.setStatus(Shipment.ShipmentStatus.PICKED_UP);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                shipmentService.assignDriver(shipmentId, driverId));
        assertTrue(ex.getMessage().contains("Cannot assign driver unless shipment status is BOOKED"));
    }

    @Test
    void activeDriverCanBeAssignedToBookedShipment() {
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);

        User activeDriver = new User();
        activeDriver.setId(driverId);
        activeDriver.setRole(User.Role.DRIVER);
        activeDriver.setStatus(User.Status.ACTIVE);

        when(userRepository.findById(driverId)).thenReturn(Optional.of(activeDriver));

        Shipment assigned = shipmentService.assignDriver(shipmentId, driverId);
        assertEquals(Shipment.ShipmentStatus.DRIVER_ASSIGNED, assigned.getStatus());
        assertEquals(driverId, assigned.getAssignedDriverId());
    }
}

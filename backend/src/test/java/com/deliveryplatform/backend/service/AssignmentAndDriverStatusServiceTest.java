package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.DeliveryEvent;
import com.deliveryplatform.backend.model.DriverStatus;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.DriverStatusRepository;
import com.deliveryplatform.backend.repository.ShipmentRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AssignmentAndDriverStatusServiceTest {

    @Mock
    private DriverStatusRepository driverStatusRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private DeliveryEventService deliveryEventService;

    @Mock
    private DriverLocationService driverLocationService;

    private DistanceService distanceService;
    private DriverStatusService driverStatusService;
    private AssignmentService assignmentService;

    private UUID driverId;
    private UUID nearDriverId;
    private UUID farDriverId;

    @BeforeEach
    void setUp() {
        distanceService = new DistanceService();
        driverStatusService = new DriverStatusService(driverStatusRepository, userRepository);
        assignmentService = new AssignmentService(
                shipmentRepository,
                driverStatusRepository,
                deliveryEventService,
                userRepository,
                driverLocationService,
                distanceService,
                30
        );
        driverId = UUID.randomUUID();
        nearDriverId = UUID.randomUUID();
        farDriverId = UUID.randomUUID();
    }

    @Test
    void pendingApprovalDriverCannotSetAvailable() {
        User pendingDriver = new User();
        pendingDriver.setId(driverId);
        pendingDriver.setRole(User.Role.DRIVER);
        pendingDriver.setStatus(User.Status.PENDING_APPROVAL);

        when(userRepository.findById(driverId)).thenReturn(Optional.of(pendingDriver));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                driverStatusService.setStatus(driverId, DriverStatus.Status.AVAILABLE));
        assertTrue(ex.getMessage().contains("Cannot set status to AVAILABLE"));
    }

    @Test
    void suspendedDriverCannotSetAvailable() {
        User suspendedDriver = new User();
        suspendedDriver.setId(driverId);
        suspendedDriver.setRole(User.Role.DRIVER);
        suspendedDriver.setStatus(User.Status.SUSPENDED);

        when(userRepository.findById(driverId)).thenReturn(Optional.of(suspendedDriver));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                driverStatusService.setStatus(driverId, DriverStatus.Status.AVAILABLE));
        assertTrue(ex.getMessage().contains("Cannot set status to AVAILABLE"));
    }

    @Test
    void activeDriverCanSetAvailable() {
        User activeDriver = new User();
        activeDriver.setId(driverId);
        activeDriver.setRole(User.Role.DRIVER);
        activeDriver.setStatus(User.Status.ACTIVE);

        when(userRepository.findById(driverId)).thenReturn(Optional.of(activeDriver));
        when(driverStatusRepository.findByDriverId(driverId)).thenReturn(Optional.empty());
        when(driverStatusRepository.save(any(DriverStatus.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DriverStatus result = driverStatusService.setStatus(driverId, DriverStatus.Status.AVAILABLE);
        assertEquals(DriverStatus.Status.AVAILABLE, result.getStatus());
    }

    @Test
    void findNearestDriverIgnoresPendingApprovalDriver() {
        Shipment shipment = shipmentAt(48.8566, 2.3522);
        DriverStatus ds = available(driverId);

        User pendingDriver = activeUser(driverId);
        pendingDriver.setStatus(User.Status.PENDING_APPROVAL);

        when(driverStatusRepository.findByStatus(DriverStatus.Status.AVAILABLE)).thenReturn(List.of(ds));
        when(userRepository.findById(driverId)).thenReturn(Optional.of(pendingDriver));

        assertNull(assignmentService.findNearestDriver(shipment));
    }

    @Test
    void findNearestDriverIgnoresSuspendedDriver() {
        Shipment shipment = shipmentAt(48.8566, 2.3522);
        DriverStatus ds = available(driverId);

        User suspendedDriver = activeUser(driverId);
        suspendedDriver.setStatus(User.Status.SUSPENDED);

        when(driverStatusRepository.findByStatus(DriverStatus.Status.AVAILABLE)).thenReturn(List.of(ds));
        when(userRepository.findById(driverId)).thenReturn(Optional.of(suspendedDriver));

        assertNull(assignmentService.findNearestDriver(shipment));
    }

    @Test
    void findNearestDriverReturnsActiveDriverWithLocation() {
        Shipment shipment = shipmentAt(48.8566, 2.3522);
        DriverStatus ds = available(driverId);

        when(driverStatusRepository.findByStatus(DriverStatus.Status.AVAILABLE)).thenReturn(List.of(ds));
        when(userRepository.findById(driverId)).thenReturn(Optional.of(activeUser(driverId)));
        when(driverLocationService.getLocation(driverId))
                .thenReturn(Optional.of(Map.of("lat", 48.8570, "lng", 2.3525)));

        DriverStatus result = assignmentService.findNearestDriver(shipment);
        assertNotNull(result);
        assertEquals(driverId, result.getDriverId());
    }

    @Test
    void findNearestDriverSkipsDriversWithoutRedisLocation() {
        Shipment shipment = shipmentAt(48.8566, 2.3522);
        DriverStatus ds = available(driverId);

        when(driverStatusRepository.findByStatus(DriverStatus.Status.AVAILABLE)).thenReturn(List.of(ds));
        when(userRepository.findById(driverId)).thenReturn(Optional.of(activeUser(driverId)));
        when(driverLocationService.getLocation(driverId)).thenReturn(Optional.empty());

        assertNull(assignmentService.findNearestDriver(shipment));
    }

    @Test
    void findNearestDriverOrdersByHaversineDistance() {
        Shipment shipment = shipmentAt(48.8566, 2.3522);
        DriverStatus near = available(nearDriverId);
        DriverStatus far = available(farDriverId);

        when(driverStatusRepository.findByStatus(DriverStatus.Status.AVAILABLE)).thenReturn(List.of(far, near));
        when(userRepository.findById(nearDriverId)).thenReturn(Optional.of(activeUser(nearDriverId)));
        when(userRepository.findById(farDriverId)).thenReturn(Optional.of(activeUser(farDriverId)));
        when(driverLocationService.getLocation(nearDriverId))
                .thenReturn(Optional.of(Map.of("lat", 48.8570, "lng", 2.3530)));
        when(driverLocationService.getLocation(farDriverId))
                .thenReturn(Optional.of(Map.of("lat", 48.9000, "lng", 2.4000)));

        DriverStatus result = assignmentService.findNearestDriver(shipment);
        assertNotNull(result);
        assertEquals(nearDriverId, result.getDriverId());
    }

    @Test
    void findNearestDriverExcludesTimedOutDriver() {
        Shipment shipment = shipmentAt(48.8566, 2.3522);
        shipment.setExcludedDriverIds(new HashSet<>(Set.of(nearDriverId)));

        DriverStatus near = available(nearDriverId);
        DriverStatus far = available(farDriverId);

        when(driverStatusRepository.findByStatus(DriverStatus.Status.AVAILABLE)).thenReturn(List.of(near, far));
        when(userRepository.findById(farDriverId)).thenReturn(Optional.of(activeUser(farDriverId)));
        when(driverLocationService.getLocation(farDriverId))
                .thenReturn(Optional.of(Map.of("lat", 48.9000, "lng", 2.4000)));

        DriverStatus result = assignmentService.findNearestDriver(shipment);
        assertNotNull(result);
        assertEquals(farDriverId, result.getDriverId());
        verify(driverLocationService, never()).getLocation(nearDriverId);
    }

    @Test
    void expiredOfferTriggersReassignmentToNextDriver() {
        UUID shipmentId = UUID.randomUUID();
        Shipment shipment = shipmentAt(48.8566, 2.3522);
        shipment.setId(shipmentId);
        shipment.setStatus(Shipment.ShipmentStatus.DRIVER_ASSIGNED);
        shipment.setAssignedDriverId(nearDriverId);
        shipment.setOfferExpiresAt(LocalDateTime.now().minusSeconds(1));
        shipment.setExcludedDriverIds(new HashSet<>());

        DriverStatus nearStatus = available(nearDriverId);
        nearStatus.setStatus(DriverStatus.Status.AVAILABLE);
        DriverStatus far = available(farDriverId);

        when(shipmentRepository.findByStatusAndOfferExpiresAtBefore(
                eq(Shipment.ShipmentStatus.DRIVER_ASSIGNED), any(LocalDateTime.class)))
                .thenReturn(List.of(shipment));
        when(shipmentRepository.findByStatus(Shipment.ShipmentStatus.BOOKED)).thenReturn(List.of());
        when(driverStatusRepository.findByDriverId(nearDriverId)).thenReturn(Optional.of(nearStatus));
        when(driverStatusRepository.save(any(DriverStatus.class))).thenAnswer(inv -> inv.getArgument(0));
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(driverStatusRepository.findByStatus(DriverStatus.Status.AVAILABLE)).thenReturn(List.of(far));
        when(userRepository.findById(farDriverId)).thenReturn(Optional.of(activeUser(farDriverId)));
        when(driverLocationService.getLocation(farDriverId))
                .thenReturn(Optional.of(Map.of("lat", 48.8570, "lng", 2.3530)));

        assignmentService.processExpiredOffersAndUnassigned();

        assertTrue(shipment.getExcludedDriverIds().contains(nearDriverId));
        assertEquals(farDriverId, shipment.getAssignedDriverId());
        assertEquals(Shipment.ShipmentStatus.DRIVER_ASSIGNED, shipment.getStatus());
        assertNotNull(shipment.getOfferExpiresAt());
        verify(deliveryEventService).record(shipmentId, nearDriverId, DeliveryEvent.EventType.REASSIGNED);
        verify(deliveryEventService).record(shipmentId, farDriverId, DeliveryEvent.EventType.REASSIGNED);

        ArgumentCaptor<DriverStatus> statusCaptor = ArgumentCaptor.forClass(DriverStatus.class);
        verify(driverStatusRepository, atLeastOnce()).save(statusCaptor.capture());
        assertTrue(statusCaptor.getAllValues().stream()
                .anyMatch(s -> nearDriverId.equals(s.getDriverId()) && s.getStatus() == DriverStatus.Status.AVAILABLE));
    }

    private static Shipment shipmentAt(double lat, double lng) {
        Shipment shipment = new Shipment();
        shipment.setPickupLat(lat);
        shipment.setPickupLng(lng);
        shipment.setExcludedDriverIds(new HashSet<>());
        return shipment;
    }

    private static DriverStatus available(UUID id) {
        DriverStatus ds = new DriverStatus();
        ds.setDriverId(id);
        ds.setStatus(DriverStatus.Status.AVAILABLE);
        return ds;
    }

    private static User activeUser(UUID id) {
        User user = new User();
        user.setId(id);
        user.setRole(User.Role.DRIVER);
        user.setStatus(User.Status.ACTIVE);
        return user;
    }
}

package com.deliveryplatform.backend.controller;

import com.deliveryplatform.backend.dto.AdminStatsSummary;
import com.deliveryplatform.backend.dto.DailyStats;
import com.deliveryplatform.backend.dto.DeliveryTimeStats;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.DeliveryEventRepository;
import com.deliveryplatform.backend.repository.DriverStatusRepository;
import com.deliveryplatform.backend.repository.ShipmentRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import com.deliveryplatform.backend.service.DriverLocationService;
import com.deliveryplatform.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private DeliveryEventRepository deliveryEventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverStatusRepository driverStatusRepository;

    @Autowired
    private DriverLocationService driverLocationService;

    @GetMapping("/drivers/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getPendingDrivers() {
        return userService.getPendingDrivers();
    }

    @PutMapping("/drivers/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public User approveDriver(@PathVariable UUID id) {
        return userService.approveDriver(id);
    }

    @PutMapping("/drivers/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public User suspendUser(@PathVariable UUID id) {
        return userService.suspendUser(id);
    }

    @GetMapping("/drivers")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getAllDrivers() {
        return userRepository.findByRole(User.Role.DRIVER);
    }

    @PutMapping("/drivers/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public User activateDriver(@PathVariable UUID id) {
        return userService.activateUser(id);
    }

    @GetMapping("/stats/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminStatsSummary getStatsSummary() {
        long totalShipments = shipmentRepository.countTotalShipments();
        long deliveredToday = shipmentRepository.countDeliveredToday(LocalDate.now().atStartOfDay());
        BigDecimal totalRevenue = shipmentRepository.sumTotalRevenue();
        long cancelledShipments = shipmentRepository.countCancelledShipments();
        
        long activeDrivers = driverStatusRepository.countByStatusIn(
            List.of(com.deliveryplatform.backend.model.DriverStatus.Status.AVAILABLE, 
                    com.deliveryplatform.backend.model.DriverStatus.Status.ON_DELIVERY)
        );
        
        double cancellationRate = totalShipments > 0 
            ? (double) cancelledShipments / totalShipments * 100 
            : 0.0;
        
        return new AdminStatsSummary(totalShipments, deliveredToday, activeDrivers, 
                                     totalRevenue != null ? totalRevenue : BigDecimal.ZERO, 
                                     cancellationRate);
    }

    @GetMapping("/stats/shipments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getShipmentStats(@RequestParam(defaultValue = "week") String range) {
        try {
            LocalDateTime startDate = getStartDate(range);
            List<Object[]> results = shipmentRepository.countShipmentsByDateRange(startDate);
            return ResponseEntity.ok(fillMissingDates(results, startDate, LocalDate.now()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to load shipment stats: " + ex.getMessage()));
        }
    }

    @GetMapping("/stats/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getRevenueStats(@RequestParam(defaultValue = "week") String range) {
        try {
            LocalDateTime startDate = getStartDate(range);
            List<Object[]> results = shipmentRepository.sumRevenueByDateRange(startDate);
            return ResponseEntity.ok(fillMissingDatesWithRevenue(results, startDate, LocalDate.now()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to load revenue stats: " + ex.getMessage()));
        }
    }

    @GetMapping("/stats/delivery-times")
    @PreAuthorize("hasRole('ADMIN')")
    public DeliveryTimeStats getDeliveryTimeStats() {
        Double overallAverage = deliveryEventRepository.averageDeliveryTimeMinutes();

        List<Object[]> byTier = deliveryEventRepository.averageDeliveryTimeByServiceTier();
        Map<String, Double> tierMap = byTier.stream()
            .filter(row -> row[0] != null)
            .collect(Collectors.toMap(
                row -> row[0].toString(),   // native query returns String
                row -> row[1] != null ? ((Number) row[1]).doubleValue() : 0.0
            ));

        return new DeliveryTimeStats(
            overallAverage != null ? overallAverage : 0.0,
            tierMap
        );
    }

    @GetMapping("/shipments/live")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> getLiveShipments() {
        List<Shipment> activeShipments = shipmentRepository.findActiveShipments();
        
        return activeShipments.stream().map(shipment -> {
            Map<String, Object> data = new HashMap<>();
            data.put("id", shipment.getId());
            data.put("trackingNumber", shipment.getTrackingNumber());
            data.put("status", shipment.getStatus());
            data.put("pickupAddress", shipment.getPickupAddress());
            data.put("pickupLat", shipment.getPickupLat());
            data.put("pickupLng", shipment.getPickupLng());
            data.put("dropoffAddress", shipment.getDropoffAddress());
            data.put("dropoffLat", shipment.getDropoffLat());
            data.put("dropoffLng", shipment.getDropoffLng());
            data.put("assignedDriverId", shipment.getAssignedDriverId());
            
            if (shipment.getAssignedDriverId() != null) {
                Optional<Map<String, Object>> driverLocation = 
                    driverLocationService.getLocation(shipment.getAssignedDriverId());
                driverLocation.ifPresent(location -> {
                    data.put("driverLat", location.get("lat"));
                    data.put("driverLng", location.get("lng"));
                });
            }
            
            return data;
        }).collect(Collectors.toList());
    }

    private LocalDateTime getStartDate(String range) {
        LocalDate today = LocalDate.now();
        return switch (range.toLowerCase()) {
            case "month" -> today.minusMonths(1).atStartOfDay();
            case "week" -> today.minusWeeks(1).atStartOfDay();
            default -> today.minusWeeks(1).atStartOfDay();
        };
    }

    private List<DailyStats> fillMissingDates(List<Object[]> results, LocalDateTime startDate, LocalDate endDate) {
        Map<LocalDate, Long> counts = results.stream()
            .collect(Collectors.toMap(
                row -> toLocalDate(row[0]),
                row -> ((Number) row[1]).longValue()
            ));

        List<DailyStats> stats = new ArrayList<>();
        LocalDate current = startDate.toLocalDate();
        while (!current.isAfter(endDate)) {
            stats.add(new DailyStats(current, counts.getOrDefault(current, 0L)));
            current = current.plusDays(1);
        }
        return stats;
    }

    private List<DailyStats> fillMissingDatesWithRevenue(List<Object[]> results, LocalDateTime startDate, LocalDate endDate) {
        Map<LocalDate, BigDecimal> revenues = results.stream()
            .collect(Collectors.toMap(
                row -> toLocalDate(row[0]),
                row -> row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO
            ));

        List<DailyStats> stats = new ArrayList<>();
        LocalDate current = startDate.toLocalDate();
        while (!current.isAfter(endDate)) {
            stats.add(new DailyStats(current, 0, revenues.getOrDefault(current, BigDecimal.ZERO)));
            current = current.plusDays(1);
        }
        return stats;
    }

    /** Handles both java.sql.Date and java.time.LocalDate returned by JPQL CAST. */
    private static LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate ld) {
            return ld;
        }
        if (value instanceof java.sql.Date sd) {
            return sd.toLocalDate();
        }
        throw new IllegalArgumentException("Cannot convert " + value.getClass() + " to LocalDate");
    }
}

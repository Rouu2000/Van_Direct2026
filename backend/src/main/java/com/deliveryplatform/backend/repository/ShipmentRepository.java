package com.deliveryplatform.backend.repository;

import com.deliveryplatform.backend.model.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {

    Optional<Shipment> findByTrackingNumber(String trackingNumber);

    List<Shipment> findByCustomerId(UUID customerId);

    List<Shipment> findByAssignedDriverId(UUID driverId);

    List<Shipment> findByAssignedDriverIdAndStatusIn(UUID driverId, List<Shipment.ShipmentStatus> statuses);

    List<Shipment> findByStatus(Shipment.ShipmentStatus status);

    List<Shipment> findByStatusAndOfferExpiresAtBefore(Shipment.ShipmentStatus status, LocalDateTime before);

    @Query("SELECT s FROM Shipment s WHERE s.status IN (com.deliveryplatform.backend.model.Shipment.ShipmentStatus.BOOKED, com.deliveryplatform.backend.model.Shipment.ShipmentStatus.DRIVER_ASSIGNED, com.deliveryplatform.backend.model.Shipment.ShipmentStatus.PICKED_UP)")
    List<Shipment> findActiveShipments();

    @Query("SELECT COUNT(s) FROM Shipment s")
    long countTotalShipments();

    @Query("SELECT COUNT(s) FROM Shipment s WHERE s.status = com.deliveryplatform.backend.model.Shipment.ShipmentStatus.DELIVERED AND s.deliveredAt >= :today")
    long countDeliveredToday(@Param("today") LocalDateTime today);

    @Query("SELECT SUM(s.priceAmount) FROM Shipment s WHERE s.status = com.deliveryplatform.backend.model.Shipment.ShipmentStatus.DELIVERED")
    BigDecimal sumTotalRevenue();

    @Query("SELECT COUNT(s) FROM Shipment s WHERE s.status = com.deliveryplatform.backend.model.Shipment.ShipmentStatus.CANCELLED")
    long countCancelledShipments();

    @Query("SELECT CAST(s.createdAt AS date) as date, COUNT(s) as count FROM Shipment s WHERE s.createdAt >= :startDate GROUP BY CAST(s.createdAt AS date) ORDER BY CAST(s.createdAt AS date)")
    List<Object[]> countShipmentsByDateRange(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT CAST(s.deliveredAt AS date) as date, SUM(s.priceAmount) as revenue FROM Shipment s WHERE s.status = com.deliveryplatform.backend.model.Shipment.ShipmentStatus.DELIVERED AND s.deliveredAt >= :startDate GROUP BY CAST(s.deliveredAt AS date) ORDER BY CAST(s.deliveredAt AS date)")
    List<Object[]> sumRevenueByDateRange(@Param("startDate") LocalDateTime startDate);
}

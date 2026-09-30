package com.deliveryplatform.backend.repository;

import com.deliveryplatform.backend.model.DeliveryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeliveryEventRepository extends JpaRepository<DeliveryEvent, UUID> {

    List<DeliveryEvent> findByShipmentIdOrderByTimestampAsc(UUID shipmentId);

    /**
     * Average delivery time in minutes: time from first ASSIGNED event to DELIVERED event per shipment.
     * Uses a self-join on delivery_events (native SQL for portability).
     */
    @Query(value = """
        SELECT AVG(EXTRACT(EPOCH FROM (d.timestamp - a.timestamp)) / 60.0)
        FROM delivery_events a
        JOIN delivery_events d ON d.shipment_id = a.shipment_id
        WHERE a.event_type = 'ASSIGNED'
          AND d.event_type = 'DELIVERED'
        """, nativeQuery = true)
    Double averageDeliveryTimeMinutes();

    /**
     * Average delivery time in minutes grouped by service tier.
     * Returns rows of [serviceTier String, averageMinutes Double].
     */
    @Query(value = """
        SELECT s.service_tier, AVG(EXTRACT(EPOCH FROM (d.timestamp - a.timestamp)) / 60.0)
        FROM delivery_events a
        JOIN delivery_events d ON d.shipment_id = a.shipment_id
        JOIN shipments s ON s.id = a.shipment_id
        WHERE a.event_type = 'ASSIGNED'
          AND d.event_type = 'DELIVERED'
        GROUP BY s.service_tier
        """, nativeQuery = true)
    List<Object[]> averageDeliveryTimeByServiceTier();
}

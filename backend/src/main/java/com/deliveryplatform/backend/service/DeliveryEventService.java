package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.DeliveryEvent;
import com.deliveryplatform.backend.repository.DeliveryEventRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class DeliveryEventService {

    private final DeliveryEventRepository deliveryEventRepository;

    public DeliveryEventService(DeliveryEventRepository deliveryEventRepository) {
        this.deliveryEventRepository = deliveryEventRepository;
    }

    public DeliveryEvent record(UUID shipmentId, UUID driverId, DeliveryEvent.EventType eventType) {
        DeliveryEvent event = new DeliveryEvent();
        event.setShipmentId(shipmentId);
        event.setDriverId(driverId);
        event.setEventType(eventType);
        return deliveryEventRepository.save(event);
    }
}

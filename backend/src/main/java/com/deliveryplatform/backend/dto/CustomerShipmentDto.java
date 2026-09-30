package com.deliveryplatform.backend.dto;

import com.deliveryplatform.backend.model.Shipment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class CustomerShipmentDto {
    private UUID id;
    private String trackingNumber;
    private UUID customerId;
    private String pickupAddress;
    private String recipientName;
    private String recipientPhone;
    private String dropoffAddress;
    private Shipment.ServiceTier serviceTier;
    private Shipment.ShipmentStatus status;
    private BigDecimal priceAmount;
    private LocalDateTime createdAt;
    private LocalDateTime deliveredAt;
    private UUID assignedDriverId;
    private int parcelCount;

    public static CustomerShipmentDto from(Shipment shipment, int parcelCount) {
        CustomerShipmentDto dto = new CustomerShipmentDto();
        dto.id = shipment.getId();
        dto.trackingNumber = shipment.getTrackingNumber();
        dto.customerId = shipment.getCustomerId();
        dto.pickupAddress = shipment.getPickupAddress();
        dto.recipientName = shipment.getRecipientName();
        dto.recipientPhone = shipment.getRecipientPhone();
        dto.dropoffAddress = shipment.getDropoffAddress();
        dto.serviceTier = shipment.getServiceTier();
        dto.status = shipment.getStatus();
        dto.priceAmount = shipment.getPriceAmount();
        dto.createdAt = shipment.getCreatedAt();
        dto.deliveredAt = shipment.getDeliveredAt();
        dto.assignedDriverId = shipment.getAssignedDriverId();
        dto.parcelCount = parcelCount;
        return dto;
    }

    public UUID getId() { return id; }
    public String getTrackingNumber() { return trackingNumber; }
    public UUID getCustomerId() { return customerId; }
    public String getPickupAddress() { return pickupAddress; }
    public String getRecipientName() { return recipientName; }
    public String getRecipientPhone() { return recipientPhone; }
    public String getDropoffAddress() { return dropoffAddress; }
    public Shipment.ServiceTier getServiceTier() { return serviceTier; }
    public Shipment.ShipmentStatus getStatus() { return status; }
    public BigDecimal getPriceAmount() { return priceAmount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public UUID getAssignedDriverId() { return assignedDriverId; }
    public int getParcelCount() { return parcelCount; }
}

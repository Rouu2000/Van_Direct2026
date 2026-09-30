package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.Parcel;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.repository.ParcelRepository;
import com.deliveryplatform.backend.repository.ShipmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ParcelService {

    private final ParcelRepository parcelRepository;
    private final ShipmentRepository shipmentRepository;

    public ParcelService(ParcelRepository parcelRepository, ShipmentRepository shipmentRepository) {
        this.parcelRepository = parcelRepository;
        this.shipmentRepository = shipmentRepository;
    }

    public List<Parcel> getParcelsForShipment(UUID shipmentId) {
        return parcelRepository.findByShipmentId(shipmentId);
    }

    @Transactional
    public Parcel addParcel(UUID shipmentId, Parcel parcel, UUID ownerId) {
        Shipment shipment = requireBookedOwnedShipment(shipmentId, ownerId);
        parcel.setId(null);
        parcel.setShipmentId(shipment.getId());
        if (parcel.getSizeCategory() == null) {
            parcel.setSizeCategory(Parcel.SizeCategory.SMALL);
        }
        return parcelRepository.save(parcel);
    }

    public List<Parcel> listParcelsForOwner(UUID shipmentId, UUID ownerId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
        if (ownerId == null || !ownerId.equals(shipment.getCustomerId())) {
            throw new IllegalStateException("Only the shipment owner can view parcels");
        }
        return parcelRepository.findByShipmentId(shipmentId);
    }

    @Transactional
    public void deleteParcel(UUID shipmentId, UUID parcelId, UUID ownerId) {
        requireBookedOwnedShipment(shipmentId, ownerId);
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new RuntimeException("Parcel not found"));
        if (!shipmentId.equals(parcel.getShipmentId())) {
            throw new IllegalArgumentException("Parcel does not belong to this shipment");
        }
        List<Parcel> parcels = parcelRepository.findByShipmentId(shipmentId);
        if (parcels.size() <= 1) {
            throw new IllegalStateException("Cannot delete the last parcel on a shipment");
        }
        parcelRepository.delete(parcel);
    }

    private Shipment requireBookedOwnedShipment(UUID shipmentId, UUID ownerId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
        if (ownerId == null || !ownerId.equals(shipment.getCustomerId())) {
            throw new IllegalStateException("Only the shipment owner can modify parcels");
        }
        if (shipment.getStatus() != Shipment.ShipmentStatus.BOOKED) {
            throw new IllegalStateException("Parcels can only be changed while shipment is BOOKED");
        }
        return shipment;
    }
}

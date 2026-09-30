package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.Parcel;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.repository.ParcelRepository;
import com.deliveryplatform.backend.repository.ShipmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ParcelServiceTest {

    @Mock
    private ParcelRepository parcelRepository;

    @Mock
    private ShipmentRepository shipmentRepository;

    @InjectMocks
    private ParcelService parcelService;

    private UUID shipmentId;
    private UUID ownerId;
    private UUID parcelId1;
    private UUID parcelId2;
    private Shipment shipment;
    private Parcel parcel1;
    private Parcel parcel2;

    @BeforeEach
    void setUp() {
        shipmentId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
        parcelId1 = UUID.randomUUID();
        parcelId2 = UUID.randomUUID();

        shipment = new Shipment();
        shipment.setId(shipmentId);
        shipment.setCustomerId(ownerId);
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);

        parcel1 = new Parcel();
        parcel1.setId(parcelId1);
        parcel1.setShipmentId(shipmentId);

        parcel2 = new Parcel();
        parcel2.setId(parcelId2);
        parcel2.setShipmentId(shipmentId);
    }

    @Test
    void deleteParcelFailsWhenDeletingLastParcel() {
        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));
        when(parcelRepository.findById(parcelId1)).thenReturn(Optional.of(parcel1));
        when(parcelRepository.findByShipmentId(shipmentId)).thenReturn(List.of(parcel1));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                parcelService.deleteParcel(shipmentId, parcelId1, ownerId)
        );
        assertTrue(ex.getMessage().contains("Cannot delete the last parcel on a shipment"),
                "Expected last parcel error, got: " + ex.getMessage());
        verify(parcelRepository, never()).delete(any());
    }

    @Test
    void deleteParcelFailsWhenShipmentIsNotBooked() {
        shipment.setStatus(Shipment.ShipmentStatus.DRIVER_ASSIGNED);
        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                parcelService.deleteParcel(shipmentId, parcelId1, ownerId)
        );
        assertTrue(ex.getMessage().contains("Parcels can only be changed while shipment is BOOKED"),
                "Expected non-BOOKED error, got: " + ex.getMessage());
        verify(parcelRepository, never()).delete(any());
    }

    @Test
    void deleteParcelFailsWhenWrongOwner() {
        UUID wrongOwnerId = UUID.randomUUID();
        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                parcelService.deleteParcel(shipmentId, parcelId1, wrongOwnerId)
        );
        assertTrue(ex.getMessage().contains("Only the shipment owner can modify parcels"),
                "Expected wrong owner error, got: " + ex.getMessage());
        verify(parcelRepository, never()).delete(any());
    }

    @Test
    void deleteParcelSucceedsWhenValid() {
        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));
        when(parcelRepository.findById(parcelId1)).thenReturn(Optional.of(parcel1));
        when(parcelRepository.findByShipmentId(shipmentId)).thenReturn(List.of(parcel1, parcel2));

        assertDoesNotThrow(() ->
                parcelService.deleteParcel(shipmentId, parcelId1, ownerId)
        );
        verify(parcelRepository).delete(parcel1);
    }
}

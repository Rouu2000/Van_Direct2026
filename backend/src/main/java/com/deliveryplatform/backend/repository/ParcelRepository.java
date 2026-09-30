package com.deliveryplatform.backend.repository;

import com.deliveryplatform.backend.model.Parcel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ParcelRepository extends JpaRepository<Parcel, UUID> {

    List<Parcel> findByShipmentId(UUID shipmentId);
}

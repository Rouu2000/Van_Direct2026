package com.deliveryplatform.backend.repository;

import com.deliveryplatform.backend.model.DriverStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriverStatusRepository extends JpaRepository<DriverStatus, UUID> {
    Optional<DriverStatus> findByDriverId(UUID driverId);

    List<DriverStatus> findByStatus(DriverStatus.Status status);

    long countByStatusIn(List<DriverStatus.Status> statuses);
}

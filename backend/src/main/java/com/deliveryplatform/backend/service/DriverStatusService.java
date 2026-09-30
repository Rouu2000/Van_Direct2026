package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.DriverStatus;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.DriverStatusRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DriverStatusService {

    private final DriverStatusRepository driverStatusRepository;
    private final UserRepository userRepository;

    public DriverStatusService(DriverStatusRepository driverStatusRepository, UserRepository userRepository) {
        this.driverStatusRepository = driverStatusRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public DriverStatus setStatus(UUID driverId, DriverStatus.Status status) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found"));
        if (driver.getRole() != User.Role.DRIVER) {
            throw new IllegalArgumentException("User is not a driver");
        }

        if (status == DriverStatus.Status.AVAILABLE && driver.getStatus() != User.Status.ACTIVE) {
            throw new IllegalStateException("Cannot set status to AVAILABLE: driver account is " + driver.getStatus());
        }

        DriverStatus driverStatus = driverStatusRepository.findByDriverId(driverId)
                .orElseGet(() -> {
                    DriverStatus created = new DriverStatus();
                    created.setDriverId(driverId);
                    return created;
                });
        driverStatus.setStatus(status);
        return driverStatusRepository.save(driverStatus);
    }

    public DriverStatus getOrCreateStatus(UUID driverId) {
        return driverStatusRepository.findByDriverId(driverId)
                .orElseGet(() -> setStatus(driverId, DriverStatus.Status.OFFLINE));
    }
}

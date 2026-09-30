package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.DriverStatus;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.DriverStatusRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DriverStatusRepository driverStatusRepository;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       DriverStatusRepository driverStatusRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.driverStatusRepository = driverStatusRepository;
    }

    public User register(User user) {
        return registerCustomer(user);
    }

    public User registerCustomer(User user) {
        user.setRole(User.Role.CUSTOMER);
        user.setStatus(User.Status.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        return userRepository.save(user);
    }

    public User registerDriver(User user) {
        user.setRole(User.Role.DRIVER);
        user.setStatus(User.Status.PENDING_APPROVAL);
        user.setCreatedAt(LocalDateTime.now());
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        return userRepository.save(user);
    }

    public User approveDriver(UUID driverId) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        if (driver.getRole() != User.Role.DRIVER) {
            throw new RuntimeException("User is not a driver");
        }

        driver.setStatus(User.Status.ACTIVE);
        User saved = userRepository.save(driver);

        // Ensure the driver has a DriverStatus row so the assignment system can find them
        driverStatusRepository.findByDriverId(driverId).orElseGet(() -> {
            DriverStatus ds = new DriverStatus();
            ds.setDriverId(driverId);
            ds.setStatus(DriverStatus.Status.OFFLINE);
            return driverStatusRepository.save(ds);
        });

        return saved;
    }

    public User suspendUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.ADMIN) {
            throw new IllegalStateException("Admin accounts cannot be suspended");
        }

        user.setStatus(User.Status.SUSPENDED);
        return userRepository.save(user);
    }

    public User activateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus(User.Status.ACTIVE);
        return userRepository.save(user);
    }

    public List<User> getPendingDrivers() {
        return userRepository.findByRoleAndStatus(User.Role.DRIVER, User.Status.PENDING_APPROVAL);
    }

    public List<User> getAllDrivers() {
        return userRepository.findByRole(User.Role.DRIVER);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User authenticate(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (user.getStatus() == User.Status.PENDING_APPROVAL) {
            throw new RuntimeException("Account is pending approval");
        }

        if (user.getStatus() == User.Status.SUSPENDED) {
            throw new RuntimeException("Account is suspended");
        }

        if (user.getStatus() != User.Status.ACTIVE) {
            throw new RuntimeException("Account is not active");
        }

        if (password == null || user.getPasswordHash() == null
                || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        return user;
    }
}

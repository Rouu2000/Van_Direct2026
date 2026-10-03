package com.deliveryplatform.backend.config;

import com.deliveryplatform.backend.model.DriverStatus;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.DriverStatusRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
@org.springframework.context.annotation.Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DriverStatusRepository driverStatusRepository;
    private final String adminPassword;

    public DataInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            DriverStatusRepository driverStatusRepository,
            @Value("${ADMIN_PASSWORD:#{null}}") String adminPassword
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.driverStatusRepository = driverStatusRepository;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        String resolvedAdminPassword = adminPassword;
        if (resolvedAdminPassword == null || resolvedAdminPassword.isBlank()) {
            resolvedAdminPassword = generatePassword();
            log.warn("ADMIN_PASSWORD is not set. Generated a one-time admin password: {}", resolvedAdminPassword);
            log.warn("Set the ADMIN_PASSWORD environment variable for predictable admin seeding.");
        }

        User admin = new User();
        admin.setName("System Admin");
        admin.setEmail("admin@vandirect.ca");
        admin.setPasswordHash(passwordEncoder.encode(resolvedAdminPassword));
        admin.setPhone("+1 (613) 555-0100");
        admin.setRole(User.Role.ADMIN);
        admin.setStatus(User.Status.ACTIVE);
        userRepository.save(admin);

        User driver = new User();
        driver.setName("John Driver");
        driver.setEmail("driver@vandirect.ca");
        driver.setPasswordHash(passwordEncoder.encode("driver123"));
        driver.setPhone("+1 (613) 555-0111");
        driver.setRole(User.Role.DRIVER);
        driver.setStatus(User.Status.ACTIVE);
        driver.setVehicleType(User.VehicleType.VAN);
        driver.setLicenseNumber("DRV-001");
        User savedDriver = userRepository.save(driver);

        // Seed a DriverStatus row so the seeded driver can receive assignments
        DriverStatus driverStatus = new DriverStatus();
        driverStatus.setDriverId(savedDriver.getId());
        driverStatus.setStatus(DriverStatus.Status.AVAILABLE);
        driverStatusRepository.save(driverStatus);

        User customer = new User();
        customer.setName("Alice Customer");
        customer.setEmail("customer@vandirect.ca");
        customer.setPasswordHash(passwordEncoder.encode("customer123"));
        customer.setPhone("+1 (613) 555-0122");
        customer.setRole(User.Role.CUSTOMER);
        customer.setStatus(User.Status.ACTIVE);
        userRepository.save(customer);
    }

    private static String generatePassword() {
        final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(16);
        for (int i = 0; i < 16; i++) {
            sb.append(alphabet.charAt(random.nextInt(alphabet.length())));
        }
        return sb.toString();
    }
}

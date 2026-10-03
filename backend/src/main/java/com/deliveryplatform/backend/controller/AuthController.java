package com.deliveryplatform.backend.controller;

import com.deliveryplatform.backend.config.JwtUtil;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.service.PasswordResetService;
import com.deliveryplatform.backend.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest request) {
        try {
            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            // Plain password from client; UserService hashes with BCrypt
            user.setPasswordHash(request.getPasswordHash());
            user.setPhone(request.getPhone());
            user.setRole(User.Role.CUSTOMER);

            if (request.getVehicleType() != null && !request.getVehicleType().isEmpty()) {
                user.setVehicleType(User.VehicleType.valueOf(request.getVehicleType()));
            }
            if (request.getLicenseNumber() != null && !request.getLicenseNumber().isEmpty()) {
                user.setLicenseNumber(request.getLicenseNumber());
            }

            User registeredUser = userService.registerCustomer(user);

            // Auto-login: return JWT + user so customer can proceed immediately
            String token = jwtUtil.generateToken(registeredUser.getEmail(), registeredUser.getRole().name(), registeredUser.getId());
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", registeredUser);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/register-driver")
    public ResponseEntity<?> registerDriver(@Valid @RequestBody RegistrationRequest request) {
        try {
            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            // Plain password from client; UserService hashes with BCrypt
            user.setPasswordHash(request.getPasswordHash());
            user.setPhone(request.getPhone());
            user.setRole(User.Role.DRIVER);

            if (request.getVehicleType() != null && !request.getVehicleType().isEmpty()) {
                user.setVehicleType(User.VehicleType.valueOf(request.getVehicleType()));
            }
            if (request.getLicenseNumber() != null && !request.getLicenseNumber().isEmpty()) {
                user.setLicenseNumber(request.getLicenseNumber());
            }

            User registeredDriver = userService.registerDriver(user);
            return ResponseEntity.ok(registeredDriver);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        // Frontend sends "password"; accept passwordHash as fallback
        String password = credentials.get("password");
        if (password == null) {
            password = credentials.get("passwordHash");
        }

        try {
            User user = userService.authenticate(email, password);
            String roleStr = user.getRole() != null ? user.getRole().name() : "CUSTOMER";
            String token = jwtUtil.generateToken(user.getEmail(), roleStr, user.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/reset-password/request")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        passwordResetService.requestReset(email);
        return ResponseEntity.ok(Map.of(
                "message", "If an account exists for that email, a reset link has been sent."
        ));
    }

    @PostMapping("/reset-password/confirm")
    public ResponseEntity<?> confirmPasswordReset(@RequestBody Map<String, String> body) {
        try {
            String token = body != null ? body.get("token") : null;
            String newPassword = body != null ? body.get("newPassword") : null;
            if (newPassword == null && body != null) {
                newPassword = body.get("password");
            }
            passwordResetService.confirmReset(token, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    public static class RegistrationRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 60, message = "Name must be 2–60 characters")
        @Pattern(regexp = "^[\\p{L}\\s'\\-]+$", message = "Name contains invalid characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Email format is invalid")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                 message = "Password must contain at least one letter and one digit")
        private String passwordHash;

        @Pattern(regexp = "^(\\+?1[-.\\s]?)?\\(?[2-9]\\d{2}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}$",
                 message = "Enter a valid North American phone number")
        private String phone;
        private String role;
        private String vehicleType;

        @Size(min = 5, max = 20, message = "Licence number must be 5–20 characters")
        @Pattern(regexp = "^[A-Za-z0-9\\-]+$", message = "Licence number must be alphanumeric")
        private String licenseNumber;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPasswordHash() {
            return passwordHash;
        }

        public void setPasswordHash(String passwordHash) {
            this.passwordHash = passwordHash;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getVehicleType() {
            return vehicleType;
        }

        public void setVehicleType(String vehicleType) {
            this.vehicleType = vehicleType;
        }

        public String getLicenseNumber() {
            return licenseNumber;
        }

        public void setLicenseNumber(String licenseNumber) {
            this.licenseNumber = licenseNumber;
        }
    }
}

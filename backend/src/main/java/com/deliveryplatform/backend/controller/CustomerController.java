package com.deliveryplatform.backend.controller;

import com.deliveryplatform.backend.config.JwtUtil;
import com.deliveryplatform.backend.dto.CustomerShipmentDto;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.UserRepository;
import com.deliveryplatform.backend.service.ShipmentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:4200")
public class CustomerController {

    private final ShipmentService shipmentService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public CustomerController(
            ShipmentService shipmentService,
            JwtUtil jwtUtil,
            UserRepository userRepository
    ) {
        this.shipmentService = shipmentService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @GetMapping("/{id}/shipments")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<?> getCustomerShipments(@PathVariable UUID id, HttpServletRequest request) {
        if (!canAccessCustomer(id, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied: customers can only read their own shipments"));
        }
        return ResponseEntity.ok(shipmentService.getCustomerShipmentDtos(id));
    }

    private boolean canAccessCustomer(UUID id, HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        String token = authHeader.substring(7);
        try {
            String role = jwtUtil.extractRole(token);
            if ("ADMIN".equalsIgnoreCase(role)) {
                return true;
            }
            if (!"CUSTOMER".equalsIgnoreCase(role)) {
                return false;
            }
            UUID tokenUserId = jwtUtil.extractUserId(token);
            if (tokenUserId != null) {
                return tokenUserId.equals(id);
            }
            String email = jwtUtil.extractEmail(token);
            return userRepository.findByEmail(email)
                    .map(User::getId)
                    .filter(id::equals)
                    .isPresent();
        } catch (Exception ex) {
            return false;
        }
    }
}

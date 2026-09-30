package com.deliveryplatform.backend.controller;

import com.deliveryplatform.backend.config.JwtUtil;
import com.deliveryplatform.backend.model.Notification;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.UserRepository;
import com.deliveryplatform.backend.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public NotificationController(
            NotificationService notificationService,
            JwtUtil jwtUtil,
            UserRepository userRepository
    ) {
        this.notificationService = notificationService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> list(HttpServletRequest request) {
        UUID userId = currentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        List<Notification> notifications = notificationService.getForUser(userId);
        long unread = notificationService.unreadCount(userId);
        return ResponseEntity.ok(Map.of(
                "notifications", notifications,
                "unreadCount", unread
        ));
    }

    @PutMapping({"/{id}/read", "/{id}"})
    public ResponseEntity<?> markRead(@PathVariable UUID id, HttpServletRequest request) {
        UUID userId = currentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        try {
            return ResponseEntity.ok(notificationService.markRead(id, userId));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    private UUID currentUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                UUID userId = jwtUtil.extractUserId(token);
                if (userId != null) {
                    return userId;
                }
                String email = jwtUtil.extractEmail(token);
                return userRepository.findByEmail(email).map(User::getId).orElse(null);
            } catch (Exception ex) {
                return null;
            }
        }
        return null;
    }
}

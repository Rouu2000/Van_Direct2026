package com.deliveryplatform.backend.config;

import com.deliveryplatform.backend.model.DriverStatus;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.DriverStatusRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import com.deliveryplatform.backend.service.DriverLocationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DriverLocationWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(DriverLocationWebSocketHandler.class);

    private final ConcurrentHashMap<UUID, Set<WebSocketSession>> sessionsByShipment = new ConcurrentHashMap<>();
    private final DriverLocationService driverLocationService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final DriverStatusRepository driverStatusRepository;
    private final JsonMapper jsonMapper;

    public DriverLocationWebSocketHandler(
            @Lazy DriverLocationService driverLocationService,
            JwtUtil jwtUtil,
            UserRepository userRepository,
            DriverStatusRepository driverStatusRepository,
            JsonMapper jsonMapper
    ) {
        this.driverLocationService = driverLocationService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.driverStatusRepository = driverStatusRepository;
        this.jsonMapper = jsonMapper != null ? jsonMapper : JsonMapper.builder().build();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        UUID shipmentId = resolveShipmentId(session.getUri());
        if (shipmentId != null) {
            session.getAttributes().put("shipmentId", shipmentId);
            sessionsByShipment.computeIfAbsent(shipmentId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
        }

        String token = resolveToken(session.getUri());
        if (token != null) {
            tryAuthenticate(session, token);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode root;
        try {
            root = jsonMapper.readTree(message.getPayload());
        } catch (Exception ex) {
            session.sendMessage(new TextMessage("{\"error\":\"Invalid JSON\"}"));
            return;
        }

        String type = text(root, "type");
        if ("auth".equalsIgnoreCase(type) || (session.getAttributes().get("driverId") == null && root.get("token") != null)) {
            String token = text(root, "token");
            if (token == null || token.isBlank()) {
                session.sendMessage(new TextMessage("{\"error\":\"token required\"}"));
                return;
            }
            if (!tryAuthenticate(session, token)) {
                session.sendMessage(new TextMessage("{\"error\":\"Authentication failed\"}"));
                session.close(CloseStatus.NOT_ACCEPTABLE);
            }
            return;
        }

        if (!"location".equalsIgnoreCase(type)) {
            session.sendMessage(new TextMessage("{\"error\":\"Unsupported message type\"}"));
            return;
        }

        UUID driverId = (UUID) session.getAttributes().get("driverId");
        if (driverId == null) {
            String token = text(root, "token");
            if (token != null && tryAuthenticate(session, token)) {
                driverId = (UUID) session.getAttributes().get("driverId");
            }
        }
        if (driverId == null) {
            session.sendMessage(new TextMessage("{\"error\":\"Not authenticated\"}"));
            return;
        }

        if (!isActiveDriverOnDelivery(driverId)) {
            session.sendMessage(new TextMessage(
                    "{\"error\":\"Driver must be ACTIVE and ON_DELIVERY to publish location\"}"));
            return;
        }

        Double lat = number(root, "lat");
        Double lng = number(root, "lng");
        if (lat == null || lng == null) {
            session.sendMessage(new TextMessage("{\"error\":\"lat and lng are required\"}"));
            return;
        }

        Map<String, Object> saved = driverLocationService.updateLocation(driverId, lat, lng);
        session.sendMessage(new TextMessage(jsonMapper.writeValueAsString(Map.of("ok", true, "location", saved))));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object value = session.getAttributes().get("shipmentId");
        if (value instanceof UUID shipmentId) {
            Set<WebSocketSession> sessions = sessionsByShipment.get(shipmentId);
            if (sessions != null) {
                sessions.remove(session);
            }
        }
    }

    public void broadcast(UUID shipmentId, String payload) {
        Set<WebSocketSession> sessions = sessionsByShipment.get(shipmentId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }
        TextMessage message = new TextMessage(payload);
        sessions.removeIf(session -> !session.isOpen());
        sessions.forEach(session -> {
            try {
                session.sendMessage(message);
            } catch (Exception ignored) {
                sessions.remove(session);
            }
        });
    }

    private boolean tryAuthenticate(WebSocketSession session, String token) {
        if (!jwtUtil.isValid(token)) {
            return false;
        }
        try {
            String role = jwtUtil.extractRole(token);
            if (role != null && role.startsWith("ROLE_")) {
                role = role.substring(5);
            }
            if (!"DRIVER".equalsIgnoreCase(role)) {
                return false;
            }

            UUID userId = jwtUtil.extractUserId(token);
            if (userId == null) {
                String email = jwtUtil.extractEmail(token);
                userId = userRepository.findByEmail(email).map(User::getId).orElse(null);
            }
            if (userId == null) {
                return false;
            }

            User user = userRepository.findById(userId).orElse(null);
            if (user == null || user.getRole() != User.Role.DRIVER || user.getStatus() != User.Status.ACTIVE) {
                return false;
            }

            session.getAttributes().put("driverId", userId);
            session.getAttributes().put("authenticated", true);
            return true;
        } catch (Exception ex) {
            log.debug("WebSocket JWT auth failed: {}", ex.getMessage());
            return false;
        }
    }

    private boolean isActiveDriverOnDelivery(UUID driverId) {
        User user = userRepository.findById(driverId).orElse(null);
        if (user == null || user.getRole() != User.Role.DRIVER || user.getStatus() != User.Status.ACTIVE) {
            return false;
        }
        Optional<DriverStatus> status = driverStatusRepository.findByDriverId(driverId);
        return status.isPresent() && status.get().getStatus() == DriverStatus.Status.ON_DELIVERY;
    }

    private UUID resolveShipmentId(URI uri) {
        String value = queryParam(uri, "shipmentId");
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String resolveToken(URI uri) {
        String token = queryParam(uri, "token");
        if (token == null || token.isBlank()) {
            token = queryParam(uri, "access_token");
        }
        return token;
    }

    private String queryParam(URI uri, String name) {
        if (uri == null) {
            return null;
        }
        return UriComponentsBuilder.fromUri(uri).build().getQueryParams().getFirst(name);
    }

    private static String text(JsonNode root, String field) {
        JsonNode node = root.get(field);
        if (node == null || node.isNull()) {
            return null;
        }
        return node.asString();
    }

    private static Double number(JsonNode root, String field) {
        JsonNode node = root.get(field);
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.asDouble();
        }
        try {
            return Double.parseDouble(node.asString());
        } catch (Exception ex) {
            return null;
        }
    }
}

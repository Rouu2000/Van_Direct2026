package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.config.DriverLocationWebSocketHandler;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.repository.ShipmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class DriverLocationService {

    private static final Logger log = LoggerFactory.getLogger(DriverLocationService.class);
    private static final Duration LOCATION_TTL = Duration.ofMinutes(5);

    private final StringRedisTemplate redisTemplate;
    private final ShipmentRepository shipmentRepository;
    private final DriverLocationWebSocketHandler webSocketHandler;
    private final JsonMapper jsonMapper;

    public DriverLocationService(
            StringRedisTemplate redisTemplate,
            ShipmentRepository shipmentRepository,
            DriverLocationWebSocketHandler webSocketHandler,
            JsonMapper jsonMapper
    ) {
        this.redisTemplate = redisTemplate;
        this.shipmentRepository = shipmentRepository;
        this.webSocketHandler = webSocketHandler;
        this.jsonMapper = jsonMapper != null ? jsonMapper : JsonMapper.builder().build();
    }

    public Map<String, Object> updateLocation(UUID driverId, double lat, double lng) {
        Map<String, Object> payload = Map.of(
                "driverId", driverId,
                "lat", lat,
                "lng", lng,
                "timestamp", Instant.now().toString()
        );
        String json = toJson(payload);
        String key = key(driverId);

        try {
            redisTemplate.opsForValue().set(key, json, LOCATION_TTL);
        } catch (Exception ex) {
            log.error("REDIS WRITE FAILED for driver {} — live location requires Redis", driverId, ex);
            throw new IllegalStateException("Redis is unavailable; cannot store driver location", ex);
        }

        shipmentRepository.findByAssignedDriverIdAndStatusIn(
                driverId,
                java.util.List.of(Shipment.ShipmentStatus.DRIVER_ASSIGNED, Shipment.ShipmentStatus.PICKED_UP)
        ).forEach(shipment -> webSocketHandler.broadcast(shipment.getId(), json));

        return payload;
    }

    public Optional<Map<String, Object>> getLocation(UUID driverId) {
        if (driverId == null) {
            return Optional.empty();
        }
        String json;
        try {
            json = redisTemplate.opsForValue().get(key(driverId));
        } catch (Exception ex) {
            log.warn("REDIS READ FAILED for driver {} — returning empty location (Redis unavailable)", driverId);
            return Optional.empty();
        }
        if (json == null || json.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(fromJson(json));
    }

    public Optional<Map<String, Object>> getLocationForShipment(UUID shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));
        if (shipment.getAssignedDriverId() == null) {
            return Optional.empty();
        }
        return getLocation(shipment.getAssignedDriverId());
    }

    private String key(UUID driverId) {
        return "driver:location:" + driverId;
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return jsonMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to serialize location payload to JSON", ex);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fromJson(String json) {
        try {
            return jsonMapper.readValue(json, Map.class);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to parse location JSON", ex);
        }
    }
}

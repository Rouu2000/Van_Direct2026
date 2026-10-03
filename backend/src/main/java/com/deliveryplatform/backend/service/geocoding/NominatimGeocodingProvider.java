package com.deliveryplatform.backend.service.geocoding;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * Nominatim geocoding provider.
 * - 1 request/second rate limit
 * - In-memory cache (no TTL; restarts clear it — acceptable for demo)
 * - Canada-biased (countrycodes=ca)
 * - Configured contact email in User-Agent (required by Nominatim ToS)
 */
@Component
public class NominatimGeocodingProvider implements GeocodingProvider {

    private static final Logger log = LoggerFactory.getLogger(NominatimGeocodingProvider.class);
    private static final String BASE = "https://nominatim.openstreetmap.org/search";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5)).build();
    private final Map<String, Optional<GeocodingResult>> cache = new ConcurrentHashMap<>();
    private final Semaphore rateLimiter = new Semaphore(1);

    @Value("${geocoding.contact-email:dev@vandirect.ca}")
    private String contactEmail;

    @Override
    public Optional<GeocodingResult> geocode(String line1, String city, String province,
                                              String postalCode, String country) {
        String pc = normalizePostalCode(postalCode);

        // Strategy 1: full structured address
        String q1 = line1 + ", " + city + ", " + province + " " + pc + ", " + country;
        Optional<GeocodingResult> r = query(q1, GeocodingResult.Accuracy.ADDRESS);
        if (r.isPresent()) return r;

        // Strategy 2: postal code only
        if (pc != null && !pc.isBlank()) {
            Optional<GeocodingResult> r2 = query(pc + ", " + country, GeocodingResult.Accuracy.POSTAL_CODE);
            if (r2.isPresent()) return r2;
        }

        // Strategy 3: city + province
        return query(city + ", " + province + ", " + country, GeocodingResult.Accuracy.CITY);
    }

    private Optional<GeocodingResult> query(String q, GeocodingResult.Accuracy accuracy) {
        if (q == null || q.isBlank()) return Optional.empty();
        String key = q.trim().toLowerCase() + "|" + accuracy;
        if (cache.containsKey(key)) return cache.get(key);

        try {
            // Rate limit: 1 req/s
            if (!rateLimiter.tryAcquire(2, TimeUnit.SECONDS)) {
                log.warn("Geocoding rate-limiter timed out for query: {}", q);
                return Optional.empty();
            }
            try {
                String url = BASE + "?q=" + URLEncoder.encode(q, StandardCharsets.UTF_8)
                        + "&format=json&limit=1&countrycodes=ca";
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("User-Agent", "VanDirect/1.0 (" + contactEmail + ")")
                        .timeout(Duration.ofSeconds(5))
                        .GET().build();
                HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
                Optional<GeocodingResult> result = parse(resp.body(), accuracy);
                cache.put(key, result);
                return result;
            } finally {
                // Release after 1 second to honour rate limit
                Thread.sleep(1000);
                rateLimiter.release();
            }
        } catch (IOException | InterruptedException e) {
            log.warn("Nominatim request failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<GeocodingResult> parse(String json, GeocodingResult.Accuracy accuracy) {
        // Minimal JSON parse — avoids pulling in Jackson for a one-field response
        if (json == null || json.isBlank() || json.equals("[]")) return Optional.empty();
        try {
            int latIdx = json.indexOf("\"lat\":\"");
            int lonIdx = json.indexOf("\"lon\":\"");
            if (latIdx < 0 || lonIdx < 0) return Optional.empty();
            String lat = json.substring(latIdx + 7, json.indexOf('"', latIdx + 7));
            String lon = json.substring(lonIdx + 7, json.indexOf('"', lonIdx + 7));
            return Optional.of(new GeocodingResult(Double.parseDouble(lat), Double.parseDouble(lon), accuracy));
        } catch (Exception e) {
            log.warn("Failed to parse Nominatim response: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public static String normalizePostalCode(String raw) {
        if (raw == null) return "";
        String up = raw.toUpperCase().replaceAll("\\s+", "");
        if (up.length() == 6) return up.substring(0, 3) + " " + up.substring(3);
        return up;
    }
}

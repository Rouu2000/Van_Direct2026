package com.deliveryplatform.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

@Component
@org.springframework.context.annotation.Profile("!test")
public class RedisStartupChecker implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RedisStartupChecker.class);

    private final RedisConnectionFactory connectionFactory;
    private final String host;
    private final int port;

    public RedisStartupChecker(
            RedisConnectionFactory connectionFactory,
            @Value("${spring.data.redis.host:localhost}") String host,
            @Value("${spring.data.redis.port:6379}") int port
    ) {
        this.connectionFactory = connectionFactory;
        this.host = host;
        this.port = port;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (var connection = connectionFactory.getConnection()) {
            connection.ping();
            log.info("Redis OK at {}:{}", host, port);
        } catch (Exception ex) {
            log.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            log.warn("REDIS IS NOT AVAILABLE at {}:{} — driver live location WILL FAIL", host, port);
            log.warn("Start Redis (e.g. docker compose up redis) before using live tracking.");
            log.warn("Cause: {}", ex.toString());
            log.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        }
    }
}

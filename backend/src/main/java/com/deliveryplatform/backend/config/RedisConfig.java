package com.deliveryplatform.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import tools.jackson.databind.json.JsonMapper;

@Configuration
public class RedisConfig {

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }

    /**
     * Expose a JsonMapper bean so DriverLocationService and
     * DriverLocationWebSocketHandler can inject it.
     * Spring Boot 4.x ships Jackson 3 (tools.jackson namespace).
     */
    @Bean
    public JsonMapper jsonMapper() {
        return JsonMapper.builder().build();
    }
}

package com.deliveryplatform.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final DriverLocationWebSocketHandler locationHandler;

    public WebSocketConfig(DriverLocationWebSocketHandler locationHandler) {
        this.locationHandler = locationHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(locationHandler, "/ws")
                .setAllowedOrigins("http://localhost:4200");
        registry.addHandler(locationHandler, "/ws-sockjs")
                .setAllowedOrigins("http://localhost:4200")
                .withSockJS();
    }
}

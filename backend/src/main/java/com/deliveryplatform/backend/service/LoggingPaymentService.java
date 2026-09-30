package com.deliveryplatform.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class LoggingPaymentService implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(LoggingPaymentService.class);

    @Override
    public String charge(UUID customerId, BigDecimal amount, String currency, String description) {
        String ref = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        log.info("[Payment stub] customerId={} amount={} {} description={} ref={}",
                customerId, amount, currency, description, ref);
        return ref;
    }
}

package com.deliveryplatform.backend.service;

import java.math.BigDecimal;
import java.util.UUID;

public interface PaymentService {
    String charge(UUID customerId, BigDecimal amount, String currency, String description);
}

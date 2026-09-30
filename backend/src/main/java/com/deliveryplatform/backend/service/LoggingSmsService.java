package com.deliveryplatform.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LoggingSmsService implements SmsService {

    private static final Logger log = LoggerFactory.getLogger(LoggingSmsService.class);

    @Override
    public void sendSms(String phoneNumber, String message) {
        log.info("[SMS stub] to={} message={}", phoneNumber, message);
    }
}

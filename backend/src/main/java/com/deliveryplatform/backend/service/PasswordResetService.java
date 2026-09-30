package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.PasswordResetToken;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.PasswordResetTokenRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final long TOKEN_TTL_HOURS = 1;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final String frontendBaseUrl;
    private final String mailFrom;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            ObjectProvider<JavaMailSender> mailSender,
            @Value("${app.frontend-base-url:http://localhost:4200}") String frontendBaseUrl,
            @Value("${spring.mail.username:noreply@vandirect.local}") String mailFrom
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
        this.frontendBaseUrl = frontendBaseUrl;
        this.mailFrom = mailFrom;
    }

    @Transactional
    public void requestReset(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        userRepository.findByEmail(email.trim().toLowerCase()).ifPresent(user -> {
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUserId(user.getId());
            resetToken.setToken(UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", ""));
            resetToken.setExpiresAt(LocalDateTime.now().plusHours(TOKEN_TTL_HOURS));
            tokenRepository.save(resetToken);
            sendResetLink(user, resetToken.getToken());
        });
    }

    @Transactional
    public void confirmReset(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Reset token is required");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("New password is required");
        }

        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (resetToken.getUsedAt() != null) {
            throw new IllegalStateException("Reset token has already been used");
        }
        if (resetToken.getExpiresAt() == null || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Reset token has expired");
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsedAt(LocalDateTime.now());
        tokenRepository.save(resetToken);
    }

    private void sendResetLink(User user, String token) {
        String link = frontendBaseUrl.replaceAll("/$", "") + "/reset-password?token=" + token;
        String subject = "VAN DIRECT password reset";
        String body = "Hello " + user.getName() + ",\n\n"
                + "Use this link to reset your password (valid for 1 hour):\n"
                + link + "\n\n"
                + "If you did not request this, ignore this email.\n";

        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailFrom);
                message.setTo(user.getEmail());
                message.setSubject(subject);
                message.setText(body);
                sender.send(message);
                log.info("Password reset email sent to {}", user.getEmail());
                return;
            } catch (Exception ex) {
                log.warn("Failed to send password reset email to {}; falling back to console. Cause: {}",
                        user.getEmail(), ex.toString());
            }
        }
        log.info("PASSWORD RESET LINK for {} => {}", user.getEmail(), link);
    }
}

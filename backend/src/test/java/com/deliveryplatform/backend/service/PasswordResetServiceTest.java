package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.PasswordResetToken;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.PasswordResetTokenRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ObjectProvider<JavaMailSender> mailSenderProvider;

    private PasswordResetService passwordResetService;

    private UUID userId;
    private User user;
    private String tokenStr;

    @BeforeEach
    void setUp() {
        passwordResetService = new PasswordResetService(
                userRepository,
                tokenRepository,
                passwordEncoder,
                mailSenderProvider,
                "http://localhost:4200",
                "noreply@vandirect.local"
        );

        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setEmail("user@example.com");
        user.setName("Test User");
        user.setPasswordHash("oldHash");

        tokenStr = "test-reset-token-12345";
    }

    @Test
    void expiredTokenThrowsIllegalStateException() {
        PasswordResetToken token = new PasswordResetToken();
        token.setId(UUID.randomUUID());
        token.setUserId(userId);
        token.setToken(tokenStr);
        token.setExpiresAt(LocalDateTime.now().minusMinutes(5));
        token.setUsedAt(null);

        when(tokenRepository.findByToken(tokenStr)).thenReturn(Optional.of(token));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                passwordResetService.confirmReset(tokenStr, "newSecurePassword123")
        );
        assertTrue(ex.getMessage().contains("expired"), "Exception message should indicate expired token: " + ex.getMessage());
        verify(userRepository, never()).save(any());
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void reusedTokenThrowsIllegalStateException() {
        PasswordResetToken token = new PasswordResetToken();
        token.setId(UUID.randomUUID());
        token.setUserId(userId);
        token.setToken(tokenStr);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        token.setUsedAt(LocalDateTime.now().minusMinutes(10));

        when(tokenRepository.findByToken(tokenStr)).thenReturn(Optional.of(token));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                passwordResetService.confirmReset(tokenStr, "newSecurePassword123")
        );
        assertTrue(ex.getMessage().contains("already been used"), "Exception message should indicate reused token: " + ex.getMessage());
        verify(userRepository, never()).save(any());
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void validTokenSuccessfullyResetsPassword() {
        PasswordResetToken token = new PasswordResetToken();
        token.setId(UUID.randomUUID());
        token.setUserId(userId);
        token.setToken(tokenStr);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(45));
        token.setUsedAt(null);

        when(tokenRepository.findByToken(tokenStr)).thenReturn(Optional.of(token));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newSecurePassword123")).thenReturn("encodedNewHash");

        assertDoesNotThrow(() ->
                passwordResetService.confirmReset(tokenStr, "newSecurePassword123")
        );

        assertEquals("encodedNewHash", user.getPasswordHash());
        assertNotNull(token.getUsedAt());
        verify(userRepository).save(user);
        verify(tokenRepository).save(token);
    }
}

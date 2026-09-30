package com.deliveryplatform.backend.controller;

import com.deliveryplatform.backend.config.JwtUtil;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.DeliveryEventRepository;
import com.deliveryplatform.backend.repository.DriverStatusRepository;
import com.deliveryplatform.backend.repository.ShipmentRepository;
import com.deliveryplatform.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration",
    "spring.scheduling.enabled=false",
    "spring.main.lazy-initialization=true"
})
@Transactional
public class AdminControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private DeliveryEventRepository deliveryEventRepository;

    @MockitoBean
    private UserRepository userRepository;

    @Autowired
    private DriverStatusRepository driverStatusRepository;

    @MockitoBean
    private com.deliveryplatform.backend.service.DriverLocationService driverLocationService;

    private UUID adminId;
    private UUID customerId;
    private String adminToken;
    private String customerToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        adminId = UUID.randomUUID();
        customerId = UUID.randomUUID();

        adminToken = jwtUtil.generateToken("admin@example.com", "ADMIN", adminId);
        customerToken = jwtUtil.generateToken("customer@example.com", "CUSTOMER", customerId);

        User admin = new User();
        admin.setId(adminId);
        admin.setEmail("admin@example.com");
        admin.setRole(User.Role.ADMIN);
        admin.setStatus(User.Status.ACTIVE);

        User customer = new User();
        customer.setId(customerId);
        customer.setEmail("customer@example.com");
        customer.setRole(User.Role.CUSTOMER);
        customer.setStatus(User.Status.ACTIVE);

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(userRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(customer));
    }

    @Test
    void getStatsSummary_returnsAdminKPIs() throws Exception {
        mockMvc.perform(get("/api/admin/stats/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalShipments").isNumber())
                .andExpect(jsonPath("$.deliveredToday").isNumber())
                .andExpect(jsonPath("$.activeDrivers").isNumber())
                .andExpect(jsonPath("$.totalRevenue").isNumber())
                .andExpect(jsonPath("$.cancellationRate").isNumber());
    }

    @Test
    void getStatsSummary_returns403ForNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/stats/summary")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getStatsSummary_returns401ForUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/admin/stats/summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getShipmentStats_returnsDailyCounts() throws Exception {
        mockMvc.perform(get("/api/admin/stats/shipments?range=week")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$[0].date").isString())
                .andExpect(jsonPath("$[0].count").isNumber());
    }

    @Test
    void getShipmentStats_returns403ForNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/stats/shipments?range=week")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getRevenueStats_returnsDailyRevenue() throws Exception {
        mockMvc.perform(get("/api/admin/stats/revenue?range=week")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$[0].date").isString())
                .andExpect(jsonPath("$[0].revenue").isNumber());
    }

    @Test
    void getRevenueStats_returns403ForNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/stats/revenue?range=week")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getDeliveryTimeStats_returnsAverageTimes() throws Exception {
        mockMvc.perform(get("/api/admin/stats/delivery-times")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallAverageMinutes").isNumber())
                .andExpect(jsonPath("$.averageByServiceTier").isMap());
    }

    @Test
    void getDeliveryTimeStats_returns403ForNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/stats/delivery-times")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getLiveShipments_returnsActiveShipments() throws Exception {
        mockMvc.perform(get("/api/admin/shipments/live")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getLiveShipments_returns403ForNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/shipments/live")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllDrivers_returnsDriverList() throws Exception {
        mockMvc.perform(get("/api/admin/drivers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getAllDrivers_returns403ForNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/drivers")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void activateDriver_activatesDriver() throws Exception {
        List<User> drivers = userRepository.findByRole(User.Role.DRIVER);
        if (drivers.isEmpty()) {
            return; // Skip if no drivers exist
        }
        
        UUID driverId = drivers.get(0).getId();
        mockMvc.perform(put("/api/admin/drivers/" + driverId + "/activate")
                        .header("Authorization", "Bearer " + adminToken)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void activateDriver_returns403ForNonAdmin() throws Exception {
        List<User> drivers = userRepository.findByRole(User.Role.DRIVER);
        if (drivers.isEmpty()) {
            return; // Skip if no drivers exist
        }
        
        UUID driverId = drivers.get(0).getId();
        mockMvc.perform(put("/api/admin/drivers/" + driverId + "/activate")
                        .header("Authorization", "Bearer " + customerToken)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
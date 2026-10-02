package com.deliveryplatform.backend.controller;

import com.deliveryplatform.backend.config.JwtUtil;
import com.deliveryplatform.backend.model.Parcel;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.model.User;
import com.deliveryplatform.backend.repository.UserRepository;
import com.deliveryplatform.backend.service.AssignmentService;
import com.deliveryplatform.backend.service.DriverLocationService;
import com.deliveryplatform.backend.service.DriverStatusService;
import com.deliveryplatform.backend.service.ShipmentService;
import com.deliveryplatform.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@SpringBootTest(properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration",
    "spring.scheduling.enabled=false",
    "spring.main.lazy-initialization=true"
})
public class SecurityMockMvcTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private ShipmentService shipmentService;

    @MockitoBean
    private AssignmentService assignmentService;

    @MockitoBean
    private DriverStatusService driverStatusService;

    @MockitoBean
    private DriverLocationService driverLocationService;

    @MockitoBean
    private UserRepository userRepository;

    private UUID customerId;
    private UUID driverId;
    private UUID adminId;

    private String customerToken;
    private String driverToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        customerId = UUID.randomUUID();
        driverId = UUID.randomUUID();
        adminId = UUID.randomUUID();

        customerToken = jwtUtil.generateToken("customer@example.com", "CUSTOMER", customerId);
        driverToken = jwtUtil.generateToken("driver@example.com", "DRIVER", driverId);
        adminToken = jwtUtil.generateToken("admin@example.com", "ADMIN", adminId);

        User customer = new User();
        customer.setId(customerId);
        customer.setEmail("customer@example.com");
        customer.setRole(User.Role.CUSTOMER);
        customer.setStatus(User.Status.ACTIVE);

        User driver = new User();
        driver.setId(driverId);
        driver.setEmail("driver@example.com");
        driver.setRole(User.Role.DRIVER);
        driver.setStatus(User.Status.ACTIVE);

        User admin = new User();
        admin.setId(adminId);
        admin.setEmail("admin@example.com");
        admin.setRole(User.Role.ADMIN);
        admin.setStatus(User.Status.ACTIVE);

        when(userRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(customer));
        when(userRepository.findByEmail("driver@example.com")).thenReturn(Optional.of(driver));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
    }

    // 1. Unauthenticated access returns 401
    @Test
    void unauthenticatedAccessToAdminEndpointReturns401() throws Exception {
        mockMvc.perform(get("/api/admin/drivers/pending"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedAccessToShipmentsReturns401() throws Exception {
        mockMvc.perform(get("/api/shipments"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedAccessToCreateShipmentReturns401() throws Exception {
        mockMvc.perform(post("/api/shipments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // 2. Customer calling an admin endpoint returns 403
    @Test
    void customerCallingAdminGetPendingDriversReturns403() throws Exception {
        mockMvc.perform(get("/api/admin/drivers/pending")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCallingAdminApproveDriverReturns403() throws Exception {
        mockMvc.perform(put("/api/admin/drivers/" + UUID.randomUUID() + "/approve")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCallingAdminSuspendDriverReturns403() throws Exception {
        mockMvc.perform(put("/api/admin/drivers/" + UUID.randomUUID() + "/suspend")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // Customer can only read own shipments
    @Test
    void customerCannotReadOtherCustomerShipment() throws Exception {
        UUID otherCustomerId = UUID.randomUUID();
        UUID shipmentId = UUID.randomUUID();

        Shipment shipment = new Shipment();
        shipment.setId(shipmentId);
        shipment.setCustomerId(otherCustomerId);

        when(shipmentService.getShipmentById(shipmentId)).thenReturn(shipment);

        mockMvc.perform(get("/api/shipments/" + shipmentId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // Driver can only update own availability / location
    @Test
    void driverCannotUpdateOtherDriverAvailability() throws Exception {
        UUID otherDriverId = UUID.randomUUID();

        mockMvc.perform(put("/api/drivers/" + otherDriverId + "/availability")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"AVAILABLE\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void driverCannotUpdateOtherDriverLocation() throws Exception {
        UUID otherDriverId = UUID.randomUUID();

        mockMvc.perform(post("/api/drivers/" + otherDriverId + "/location")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lat\":48.8566,\"lng\":2.3522}"))
                .andExpect(status().isForbidden());
    }

    // 3. Invalid status transitions rejected
    @Test
    void invalidStatusTransitionIsRejected() throws Exception {
        UUID shipmentId = UUID.randomUUID();
        Shipment shipment = new Shipment();
        shipment.setId(shipmentId);
        shipment.setAssignedDriverId(driverId);
        shipment.setStatus(Shipment.ShipmentStatus.BOOKED);

        when(shipmentService.getShipmentById(shipmentId)).thenReturn(shipment);
        when(shipmentService.updateStatus(eq(shipmentId), eq(Shipment.ShipmentStatus.DELIVERED)))
                .thenThrow(new IllegalStateException("Cannot transition to DELIVERED from BOOKED. Shipment must be PICKED_UP."));

        mockMvc.perform(put("/api/shipments/" + shipmentId + "/status")
                        .header("Authorization", "Bearer " + driverToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isConflict());
    }

    // 4. Pending driver cannot be assigned
    @Test
    void pendingDriverCannotBeAssignedRejected() throws Exception {
        UUID shipmentId = UUID.randomUUID();
        UUID pendingDriverId = UUID.randomUUID();

        when(shipmentService.assignDriver(shipmentId, pendingDriverId))
                .thenThrow(new IllegalStateException("Driver must be an ACTIVE driver"));

        mockMvc.perform(put("/api/shipments/" + shipmentId + "/assign")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"driverId\":\"" + pendingDriverId + "\"}"))
                .andExpect(status().isConflict());
    }

    // 5. Admin endpoint security tests
    @Test
    void adminStatsSummary_requiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/stats/summary")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminStatsSummary_adminCanAccess() throws Exception {
        mockMvc.perform(get("/api/admin/stats/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void adminShipmentStats_requiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/stats/shipments?range=week")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminRevenueStats_requiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/stats/revenue?range=week")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminDeliveryTimeStats_requiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/stats/delivery-times")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminLiveShipments_requiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/shipments/live")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminDriversList_requiresAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/drivers")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminActivateDriver_requiresAdminRole() throws Exception {
        mockMvc.perform(put("/api/admin/drivers/" + UUID.randomUUID() + "/activate")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    // ── Public estimate endpoint ─────────────────────────────
    @Test
    void estimatePrice_isPublicNoAuthRequired() throws Exception {
        // Should be accessible without a token (returns 200 or 400 on bad input, never 401)
        String body = """
            {"serviceTier":"STANDARD","pickupLat":36.8,"pickupLng":10.18,
             "dropoffLat":36.85,"dropoffLng":10.20,
             "parcels":[{"weightKg":2,"sizeCategory":"SMALL"}]}""";
        mockMvc.perform(post("/api/shipments/estimate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is2xxSuccessful());
    }
}
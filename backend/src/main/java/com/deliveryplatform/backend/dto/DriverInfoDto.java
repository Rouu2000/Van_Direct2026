package com.deliveryplatform.backend.dto;

import com.deliveryplatform.backend.model.User;

/**
 * Safe subset of driver info included in shipment responses.
 * Never exposes email, passwordHash, or licenseNumber.
 */
public class DriverInfoDto {

    private final String name;
    private final String firstName;
    private final String phone;
    private final String vehicleType;

    public DriverInfoDto(User driver) {
        this.name = driver.getName();
        // First name only (everything before the first space)
        String n = driver.getName();
        this.firstName = (n != null && n.contains(" ")) ? n.substring(0, n.indexOf(' ')) : n;
        this.phone = driver.getPhone();
        this.vehicleType = driver.getVehicleType() != null ? driver.getVehicleType().name() : null;
    }

    /** Full name + phone + vehicle — for authenticated customer view */
    public String getName()        { return name; }
    public String getPhone()       { return phone; }
    public String getVehicleType() { return vehicleType; }

    /** First name + vehicle only — for the public tracking endpoint */
    public String getFirstName()   { return firstName; }
}

package com.deliveryplatform.backend.dto;

import java.math.BigDecimal;

public class AdminStatsSummary {
    private long totalShipments;
    private long deliveredToday;
    private long activeDrivers;
    private BigDecimal totalRevenue;
    private double cancellationRate;

    public AdminStatsSummary() {}

    public AdminStatsSummary(long totalShipments, long deliveredToday, long activeDrivers, 
                           BigDecimal totalRevenue, double cancellationRate) {
        this.totalShipments = totalShipments;
        this.deliveredToday = deliveredToday;
        this.activeDrivers = activeDrivers;
        this.totalRevenue = totalRevenue;
        this.cancellationRate = cancellationRate;
    }

    public long getTotalShipments() { return totalShipments; }
    public void setTotalShipments(long totalShipments) { this.totalShipments = totalShipments; }

    public long getDeliveredToday() { return deliveredToday; }
    public void setDeliveredToday(long deliveredToday) { this.deliveredToday = deliveredToday; }

    public long getActiveDrivers() { return activeDrivers; }
    public void setActiveDrivers(long activeDrivers) { this.activeDrivers = activeDrivers; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public double getCancellationRate() { return cancellationRate; }
    public void setCancellationRate(double cancellationRate) { this.cancellationRate = cancellationRate; }
}
package com.deliveryplatform.backend.dto;

import java.util.Map;

public class DeliveryTimeStats {
    private double overallAverageMinutes;
    private Map<String, Double> averageByServiceTier;

    public DeliveryTimeStats() {}

    public DeliveryTimeStats(double overallAverageMinutes, Map<String, Double> averageByServiceTier) {
        this.overallAverageMinutes = overallAverageMinutes;
        this.averageByServiceTier = averageByServiceTier;
    }

    public double getOverallAverageMinutes() { return overallAverageMinutes; }
    public void setOverallAverageMinutes(double overallAverageMinutes) { this.overallAverageMinutes = overallAverageMinutes; }

    public Map<String, Double> getAverageByServiceTier() { return averageByServiceTier; }
    public void setAverageByServiceTier(Map<String, Double> averageByServiceTier) { this.averageByServiceTier = averageByServiceTier; }
}
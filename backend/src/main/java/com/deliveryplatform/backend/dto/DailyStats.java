package com.deliveryplatform.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DailyStats {
    private LocalDate date;
    private long count;
    private BigDecimal revenue;

    public DailyStats() {}

    public DailyStats(LocalDate date, long count) {
        this.date = date;
        this.count = count;
    }

    public DailyStats(LocalDate date, long count, BigDecimal revenue) {
        this.date = date;
        this.count = count;
        this.revenue = revenue;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public long getCount() { return count; }
    public void setCount(long count) { this.count = count; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
}
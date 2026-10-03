package com.deliveryplatform.backend.service.geocoding;

public class GeocodingResult {
    public enum Accuracy { ADDRESS, POSTAL_CODE, CITY, MANUAL }

    private final double lat;
    private final double lng;
    private final Accuracy accuracy;

    public GeocodingResult(double lat, double lng, Accuracy accuracy) {
        this.lat = lat; this.lng = lng; this.accuracy = accuracy;
    }
    public double getLat()        { return lat; }
    public double getLng()        { return lng; }
    public Accuracy getAccuracy() { return accuracy; }
}

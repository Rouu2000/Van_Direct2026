import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService, LiveShipment } from '../../../services/admin.service';
import L from 'leaflet';

@Component({
  selector: 'app-live-shipments',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './live-shipments.component.html',
  styleUrl: './live-shipments.component.css'
})
export class LiveShipmentsComponent implements OnInit, OnDestroy {
  loading = true;
  shipments: LiveShipment[] = [];
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private refreshInterval: any = null;

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.loadShipments();
    this.refreshInterval = setInterval(() => {
      this.loadShipments();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = L.map('live-shipments-map').setView([40.7128, -74.0060], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private loadShipments(): void {
    this.adminService.getLiveShipments().subscribe({
      next: (data) => {
        this.shipments = data;
        this.updateMap();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading live shipments:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private updateMap(): void {
    if (!this.map) return;

    this.markers.forEach(marker => this.map?.removeLayer(marker));
    this.markers = [];

    this.shipments.forEach(shipment => {
      if (shipment.pickupLat && shipment.pickupLng) {
        const pickupMarker = L.marker([shipment.pickupLat, shipment.pickupLng], {
          icon: L.divIcon({
            className: 'pickup-marker',
            html: '<div class="marker-icon pickup">📦</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(this.map!);
        pickupMarker.bindPopup(`<b>Pickup:</b> ${shipment.pickupAddress}<br><b>Tracking:</b> ${shipment.trackingNumber}`);
        this.markers.push(pickupMarker);
      }

      if (shipment.dropoffLat && shipment.dropoffLng) {
        const dropoffMarker = L.marker([shipment.dropoffLat, shipment.dropoffLng], {
          icon: L.divIcon({
            className: 'dropoff-marker',
            html: '<div class="marker-icon dropoff">🏁</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(this.map!);
        dropoffMarker.bindPopup(`<b>Dropoff:</b> ${shipment.dropoffAddress}<br><b>Tracking:</b> ${shipment.trackingNumber}`);
        this.markers.push(dropoffMarker);
      }

      if (shipment.driverLat && shipment.driverLng) {
        const driverMarker = L.marker([shipment.driverLat, shipment.driverLng], {
          icon: L.divIcon({
            className: 'driver-marker',
            html: '<div class="marker-icon driver">🚚</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(this.map!);
        driverMarker.bindPopup(`<b>Driver Location</b><br><b>Status:</b> ${shipment.status}<br><b>Tracking:</b> ${shipment.trackingNumber}`);
        this.markers.push(driverMarker);
      }
    });

    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'BOOKED': return '#ff9800';
      case 'DRIVER_ASSIGNED': return '#2196f3';
      case 'PICKED_UP': return '#4caf50';
      default: return '#9e9e9e';
    }
  }
}

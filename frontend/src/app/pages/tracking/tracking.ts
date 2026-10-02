import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as L from 'leaflet';
import { ShipmentService } from '../../services/shipment.service';
import { WebSocketService } from '../../services/web-socket.service';

// Fix default marker icon paths for Angular bundler
const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
const iconUrl = 'assets/leaflet/marker-icon.png';
const shadowUrl = 'assets/leaflet/marker-shadow.png';
const DefaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './tracking.html',
  styleUrl: './tracking.css'
})
export class TrackingComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  trackingNumber = '';
  loading = false;
  error: string | null = null;
  shipment: any | null = null;
  parcels: any[] = [];
  driver: any | null = null;
  driverLocation: any | null = null;
  liveTrackingError: string | null = null;

  private map: L.Map | null = null;
  private pickupMarker: L.Marker | null = null;
  private dropoffMarker: L.Marker | null = null;
  private driverMarker: L.Marker | null = null;
  private mapNeedsInit = false;
  private pollTimer: any = null;

  constructor(
    private shipmentService: ShipmentService,
    private webSocketService: WebSocketService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const tn = this.route.snapshot.queryParamMap.get('tn');
    if (tn) {
      this.trackingNumber = tn;
      this.track();
    }
  }

  ngAfterViewChecked(): void {
    if (this.mapNeedsInit && this.mapContainer && this.isLiveTrackable()) {
      this.mapNeedsInit = false;
      this.initMap();
    }
  }

  ngOnDestroy(): void {
    this.webSocketService.disconnect();
    this.destroyMap();
    this.stopPolling();
  }

  track(): void {
    if (!this.trackingNumber.trim()) {
      this.error = 'Enter a tracking number.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error = null;
    this.shipment = null;
    this.parcels = [];
    this.driver = null;
    this.driverLocation = null;
    this.liveTrackingError = null;
    this.webSocketService.disconnect();
    this.destroyMap();
    this.stopPolling();
    this.cdr.markForCheck();

    this.shipmentService.trackShipment(this.trackingNumber.trim()).subscribe({
      next: (res) => {
        this.shipment = res?.shipment || res;
        this.parcels = res?.parcels || [];
        this.driver = res?.driver || null;
        this.loading = false;
        this.mapNeedsInit = this.isLiveTrackable();
        this.connectLiveTracking();
        // Poll every 5s so status updates without a manual refresh
        if (this.isLiveTrackable()) {
          this.startPolling();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No shipment found for this tracking number.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  estimatedNote(): string {
    if (!this.shipment) return '';
    if (this.shipment.status === 'DELIVERED') {
      return this.shipment.deliveredAt
        ? `Delivered on ${new Date(this.shipment.deliveredAt).toLocaleString()}`
        : 'Delivered';
    }
    if (this.shipment.serviceTier === 'EXPRESS') {
      return 'Estimated delivery: 1 business day';
    }
    return 'Estimated delivery: 2-3 business days';
  }

  isLiveTrackable(): boolean {
    return this.shipment?.status === 'DRIVER_ASSIGNED' || this.shipment?.status === 'PICKED_UP';
  }

  private connectLiveTracking(): void {
    if (!this.shipment || !this.isLiveTrackable()) {
      return;
    }

    this.shipmentService.getDriverLocation(this.shipment.id).subscribe({
      next: (location) => {
        this.driverLocation = location;
        this.updateDriverMarker(location);
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    this.webSocketService.subscribeToShipmentLocation(
      this.shipment.id,
      (location) => {
        this.driverLocation = location;
        this.liveTrackingError = null;
        this.updateDriverMarker(location);
        this.cdr.markForCheck();
      },
      () => {
        this.liveTrackingError = 'Live tracking connection is not available.';
        this.cdr.markForCheck();
      }
    );
  }

  private initMap(): void {
    if (!this.mapContainer || this.map) {
      return;
    }

    const pickupLat = this.shipment?.pickupLat ?? 48.8566;
    const pickupLng = this.shipment?.pickupLng ?? 2.3522;
    const dropoffLat = this.shipment?.dropoffLat;
    const dropoffLng = this.shipment?.dropoffLng;

    this.map = L.map(this.mapContainer.nativeElement).setView([pickupLat, pickupLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    if (this.shipment?.pickupLat != null && this.shipment?.pickupLng != null) {
      this.pickupMarker = L.marker([this.shipment.pickupLat, this.shipment.pickupLng])
        .addTo(this.map)
        .bindPopup('Pickup');
    }
    if (dropoffLat != null && dropoffLng != null) {
      this.dropoffMarker = L.marker([dropoffLat, dropoffLng])
        .addTo(this.map)
        .bindPopup('Drop-off');
    }

    const bounds: L.LatLngExpression[] = [];
    if (this.pickupMarker) bounds.push(this.pickupMarker.getLatLng());
    if (this.dropoffMarker) bounds.push(this.dropoffMarker.getLatLng());
    if (bounds.length > 1) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }

    if (this.driverLocation) {
      this.updateDriverMarker(this.driverLocation);
    }

    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  private updateDriverMarker(location: any): void {
    if (!location || location.lat == null || location.lng == null) {
      return;
    }
    if (!this.map) {
      this.mapNeedsInit = true;
      return;
    }
    const latLng: L.LatLngExpression = [Number(location.lat), Number(location.lng)];
    if (!this.driverMarker) {
      this.driverMarker = L.marker(latLng, {
        icon: L.icon({
          iconUrl: 'assets/leaflet/marker-icon.png',
          iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
          shadowUrl: 'assets/leaflet/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(this.map).bindPopup('Driver');
    } else {
      this.driverMarker.setLatLng(latLng);
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => this.pollOnce(), 5000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private pollOnce(): void {
    if (!this.trackingNumber) return;
    this.shipmentService.trackShipment(this.trackingNumber.trim()).subscribe({
      next: (res) => {
        const updated = res?.shipment || res;
        const prevStatus = this.shipment?.status;
        this.shipment = updated;
        this.driver = res?.driver || this.driver;
        this.parcels = res?.parcels || this.parcels;
        // If status changed to a terminal state, stop polling
        if (updated?.status === 'DELIVERED' || updated?.status === 'CANCELLED') {
          this.stopPolling();
          this.webSocketService.disconnect();
          this.destroyMap();
        }
        if (prevStatus !== updated?.status) {
          this.mapNeedsInit = this.isLiveTrackable();
          this.cdr.markForCheck();
        }
      },
      error: () => {} // silent on poll errors
    });
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.pickupMarker = null;
    this.dropoffMarker = null;
    this.driverMarker = null;
    this.mapNeedsInit = false;
  }
}

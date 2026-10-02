import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DriverService } from '../../../services/driver.service';
import { WebSocketService } from '../../../services/web-socket.service';

@Component({
  selector: 'app-driver-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './deliveries.component.html',
  styleUrls: ['./deliveries.component.css']
})
export class DriverDeliveriesComponent implements OnInit, OnDestroy {
  deliveries: any[] = [];
  loading = true;
  error: string | null = null;
  updatingId: string | null = null;
  selectedDelivery: any | null = null;
  driverId: string | null = null;
  availability: 'AVAILABLE' | 'OFFLINE' = 'OFFLINE';
  isOnDelivery = false;
  locationWatchId: number | null = null;
  locationTimer: any = null;
  latestPosition: GeolocationPosition | null = null;
  private streaming = false;

  constructor(
    private driverService: DriverService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.hydrateFromStorage();
    this.driverId = this.authService.getUserId();
    this.loadStatus();
    this.loadDeliveries();
  }

  /** Load the real availability status from the backend so a page refresh stays in sync. */
  loadStatus(): void {
    if (!this.driverId) return;
    this.driverService.getStatus(this.driverId).subscribe({
      next: (ds: any) => {
        const s = ds?.status ?? 'OFFLINE';
        // ON_DELIVERY is set by the system; treat it as a special read-only state
        this.availability = (s === 'AVAILABLE') ? 'AVAILABLE' : 'OFFLINE';
        this.isOnDelivery = (s === 'ON_DELIVERY');
        this.cdr.markForCheck();
      },
      error: () => {} // keep default OFFLINE on error
    });
  }

  ngOnDestroy(): void {
    this.stopLocationStreaming();
  }

  loadDeliveries(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    if (!this.driverId) {
      this.error = 'Driver account not found.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.driverService.getDeliveries(this.driverId).subscribe({
      next: (data) => {
        this.deliveries = Array.isArray(data) ? data : [];
        this.loading = false;
        const onDelivery = this.deliveries.some(
          d => d.status === 'DRIVER_ASSIGNED' || d.status === 'PICKED_UP'
        );
        this.isOnDelivery = onDelivery;
        if (onDelivery) {
          this.startLocationStreaming();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load deliveries.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openDetails(delivery: any): void {
    this.selectedDelivery = delivery;
    this.cdr.markForCheck();
  }

  closeDetails(): void {
    this.selectedDelivery = null;
    this.cdr.markForCheck();
  }

  setAvailability(online: boolean): void {
    if (!this.driverId) return;

    // Guard: cannot go offline while actively on a delivery
    if (!online && this.isOnDelivery) {
      alert('You cannot go offline while you have an active delivery. Complete or decline the current delivery first.');
      this.cdr.markForCheck();
      return;
    }

    const nextStatus = online ? 'AVAILABLE' : 'OFFLINE';
    this.driverService.setAvailability(this.driverId, nextStatus).subscribe({
      next: () => {
        this.availability = nextStatus;
        if (!online) {
          this.stopLocationStreaming();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update availability.');
      }
    });
  }

  accept(shipmentId: string): void {
    this.updatingId = shipmentId;
    this.driverService.acceptShipment(shipmentId).subscribe({
      next: () => {
        this.updatingId = null;
        this.startLocationStreaming();
        this.loadDeliveries();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to accept delivery.');
        this.updatingId = null;
        this.cdr.markForCheck();
      }
    });
  }

  decline(shipmentId: string): void {
    this.updatingId = shipmentId;
    this.driverService.declineShipment(shipmentId).subscribe({
      next: () => {
        this.updatingId = null;
        this.availability = 'OFFLINE';
        this.stopLocationStreaming();
        this.loadDeliveries();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to decline delivery.');
        this.updatingId = null;
        this.cdr.markForCheck();
      }
    });
  }

  updateStatus(shipmentId: string, newStatus: 'PICKED_UP' | 'DELIVERED'): void {
    if (!newStatus) return;
    this.updatingId = shipmentId;
    this.cdr.markForCheck();

    this.driverService.updateShipmentStatus(shipmentId, newStatus).subscribe({
      next: () => {
        this.updatingId = null;
        if (newStatus === 'PICKED_UP') {
          this.startLocationStreaming();
        }
        if (newStatus === 'DELIVERED') {
          this.stopLocationStreaming();
          this.availability = 'AVAILABLE';
        }
        this.loadDeliveries();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update status.');
        this.updatingId = null;
        this.cdr.markForCheck();
      }
    });
  }

  private startLocationStreaming(): void {
    if (!this.driverId || !('geolocation' in navigator)) {
      return;
    }
    this.streaming = true;
    const token = this.authService.getToken();
    if (token) {
      this.webSocketService.connectDriverPublisher(token);
    }
    if (this.locationWatchId === null) {
      this.locationWatchId = navigator.geolocation.watchPosition((position) => {
        this.latestPosition = position;
      });
    }
    if (!this.locationTimer) {
      this.locationTimer = setInterval(() => this.sendLatestLocation(), 5000);
      this.sendLatestLocation();
    }
  }

  private stopLocationStreaming(): void {
    this.streaming = false;
    this.webSocketService.disconnectDriverPublisher();
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
    if (this.locationTimer) {
      clearInterval(this.locationTimer);
      this.locationTimer = null;
    }
  }

  private sendLatestLocation(): void {
    if (!this.streaming || !this.driverId || !this.latestPosition) {
      return;
    }
    const { latitude, longitude } = this.latestPosition.coords;
    const sent = this.webSocketService.sendDriverLocation(latitude, longitude);
    if (!sent) {
      // HTTP fallback when socket is down (reconnect runs in the background)
      this.driverService.pushLocation(this.driverId, latitude, longitude).subscribe({ error: () => {} });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return 'badge-success';
      case 'PICKED_UP':
      case 'DRIVER_ASSIGNED':
        return 'badge-info';
      case 'BOOKED':
        return 'badge-warning';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
}

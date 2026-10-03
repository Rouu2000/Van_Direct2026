import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CadPipe } from '../../../shared/cad.pipe';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DriverService } from '../../../services/driver.service';
import { WebSocketService } from '../../../services/web-socket.service';

type Tab = 'active' | 'history';

@Component({
  selector: 'app-driver-deliveries',
  standalone: true,
  imports: [CadPipe, CommonModule, FormsModule, RouterModule],
  templateUrl: './deliveries.component.html',
  styleUrls: ['./deliveries.component.css']
})
export class DriverDeliveriesComponent implements OnInit, OnDestroy {
  // ── Tab state ─────────────────────────────────────────────
  activeTab: Tab = 'active';

  // ── Active deliveries ──────────────────────────────────────
  deliveries: any[] = [];
  loading = true;
  error: string | null = null;
  updatingId: string | null = null;
  selectedDelivery: any | null = null;

  // ── Driver meta ────────────────────────────────────────────
  driverId: string | null = null;
  availability: 'AVAILABLE' | 'OFFLINE' = 'OFFLINE';
  isOnDelivery = false;

  // ── GPS streaming ──────────────────────────────────────────
  locationWatchId: number | null = null;
  locationTimer: any = null;
  latestPosition: GeolocationPosition | null = null;
  private streaming = false;

  // ── History tab ────────────────────────────────────────────
  history: any[] = [];
  historyLoading = false;
  historyError: string | null = null;
  historyTotal = 0;
  historyTotalPages = 0;
  historyPage = 0;
  readonly historyPageSize = 10;
  historyStatusFilter = '';
  historyFrom = '';
  historyTo = '';

  // ── Summary cards (history) ────────────────────────────────
  deliveredToday = 0;
  deliveredThisWeek = 0;
  deliveredTotal = 0;

  readonly Math = Math;  // expose Math to template

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

  ngOnDestroy(): void { this.stopLocationStreaming(); }

  // ── Tab switching ──────────────────────────────────────────
  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'history') { this.historyPage = 0; this.loadHistory(); }
    this.cdr.markForCheck();
  }

  // ── Status load ────────────────────────────────────────────
  loadStatus(): void {
    if (!this.driverId) return;
    this.driverService.getStatus(this.driverId).subscribe({
      next: (ds: any) => {
        const s = ds?.status ?? 'OFFLINE';
        this.availability = s === 'AVAILABLE' ? 'AVAILABLE' : 'OFFLINE';
        this.isOnDelivery = s === 'ON_DELIVERY';
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  // ── Active deliveries ──────────────────────────────────────
  loadDeliveries(): void {
    this.loading = true; this.error = null; this.cdr.markForCheck();
    if (!this.driverId) { this.error = 'Driver account not found.'; this.loading = false; this.cdr.markForCheck(); return; }

    this.driverService.getDeliveries(this.driverId).subscribe({
      next: (data) => {
        // Sort: PICKED_UP first, then by oldest assigned
        const sorted = (Array.isArray(data) ? data : []).sort((a: any, b: any) => {
          if (a.status === 'PICKED_UP' && b.status !== 'PICKED_UP') return -1;
          if (b.status === 'PICKED_UP' && a.status !== 'PICKED_UP') return 1;
          return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
        });
        this.deliveries = sorted;
        this.loading = false;
        const onDelivery = this.deliveries.some(d => d.status === 'DRIVER_ASSIGNED' || d.status === 'PICKED_UP');
        this.isOnDelivery = onDelivery;
        if (onDelivery) { this.startLocationStreaming(); }
        else { this.stopLocationStreaming(); this.loadStatus(); }
        this.cdr.markForCheck();
      },
      error: (err) => { this.error = err.error?.message || 'Failed to load deliveries.'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  // ── History ────────────────────────────────────────────────
  loadHistory(): void {
    if (!this.driverId) return;
    this.historyLoading = true; this.historyError = null; this.cdr.markForCheck();

    this.driverService.getDeliveryHistory(this.driverId, {
      status: this.historyStatusFilter || undefined,
      from:   this.historyFrom || undefined,
      to:     this.historyTo   || undefined,
      page:   this.historyPage,
      size:   this.historyPageSize
    }).subscribe({
      next: (res: any) => {
        this.history = res.content ?? [];
        this.historyTotal = res.totalElements ?? 0;
        this.historyTotalPages = res.totalPages ?? 0;
        this.computeSummary();
        this.historyLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => { this.historyError = err.error?.message || 'Failed to load history.'; this.historyLoading = false; this.cdr.markForCheck(); }
    });
  }

  private computeSummary(): void {
    // Load all history without filters to compute summary cards
    if (!this.driverId) return;
    this.driverService.getDeliveryHistory(this.driverId, { status: 'DELIVERED', size: 1000 }).subscribe({
      next: (res: any) => {
        const all: any[] = res.content ?? [];
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart  = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
        this.deliveredTotal    = res.totalElements ?? 0;
        this.deliveredToday    = all.filter(s => s.deliveredAt && new Date(s.deliveredAt) >= todayStart).length;
        this.deliveredThisWeek = all.filter(s => s.deliveredAt && new Date(s.deliveredAt) >= weekStart).length;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  applyHistoryFilters(): void { this.historyPage = 0; this.loadHistory(); }
  clearHistoryFilters(): void { this.historyStatusFilter = ''; this.historyFrom = ''; this.historyTo = ''; this.historyPage = 0; this.loadHistory(); }
  prevHistoryPage(): void { if (this.historyPage > 0) { this.historyPage--; this.loadHistory(); } }
  nextHistoryPage(): void { if (this.historyPage < this.historyTotalPages - 1) { this.historyPage++; this.loadHistory(); } }

  deliveryDuration(s: any): string {
    if (!s.deliveredAt) return '—';
    const events = s.deliveryEvents;
    const pickedUpEvent = Array.isArray(events) ? events.find((e: any) => e.eventType === 'PICKED_UP') : null;
    if (!pickedUpEvent) return '—';
    const mins = Math.round((new Date(s.deliveredAt).getTime() - new Date(pickedUpEvent.timestamp).getTime()) / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  }

  // ── Active delivery actions ────────────────────────────────
  openDetails(d: any): void { this.selectedDelivery = d; this.cdr.markForCheck(); }
  closeDetails(): void { this.selectedDelivery = null; this.cdr.markForCheck(); }

  setAvailability(online: boolean): void {
    if (!this.driverId) return;
    if (!online && this.isOnDelivery) {
      alert('You cannot go offline while you have an active delivery. Complete or decline it first.');
      return;
    }
    const next = online ? 'AVAILABLE' : 'OFFLINE';
    this.driverService.setAvailability(this.driverId, next).subscribe({
      next: () => { this.availability = next; if (!online) this.stopLocationStreaming(); this.cdr.markForCheck(); },
      error: (err) => alert(err.error?.message || 'Failed to update availability.')
    });
  }

  accept(shipmentId: string): void {
    this.updatingId = shipmentId;
    this.driverService.acceptShipment(shipmentId).subscribe({
      next: () => { this.updatingId = null; this.startLocationStreaming(); this.loadDeliveries(); },
      error: (err) => { alert(err.error?.message || 'Failed to accept.'); this.updatingId = null; this.cdr.markForCheck(); }
    });
  }

  decline(shipmentId: string): void {
    this.updatingId = shipmentId;
    this.driverService.declineShipment(shipmentId).subscribe({
      next: () => { this.updatingId = null; this.loadDeliveries(); },
      error: (err) => { alert(err.error?.message || 'Failed to decline.'); this.updatingId = null; this.cdr.markForCheck(); }
    });
  }

  updateStatus(shipmentId: string, newStatus: 'PICKED_UP' | 'DELIVERED'): void {
    this.updatingId = shipmentId; this.cdr.markForCheck();
    this.driverService.updateShipmentStatus(shipmentId, newStatus).subscribe({
      next: () => {
        this.updatingId = null;
        if (newStatus === 'PICKED_UP') this.startLocationStreaming();
        this.loadDeliveries();
      },
      error: (err) => { alert(err.error?.message || 'Failed to update status.'); this.updatingId = null; this.cdr.markForCheck(); }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':       return 'badge-success';
      case 'PICKED_UP':
      case 'DRIVER_ASSIGNED': return 'badge-info';
      case 'BOOKED':          return 'badge-warning';
      case 'CANCELLED':       return 'badge-danger';
      default:                return 'badge-secondary';
    }
  }

  // ── GPS streaming ──────────────────────────────────────────
  private startLocationStreaming(): void {
    if (!this.driverId || !('geolocation' in navigator)) return;
    this.streaming = true;
    const token = this.authService.getToken();
    if (token) this.webSocketService.connectDriverPublisher(token);
    if (this.locationWatchId === null) {
      this.locationWatchId = navigator.geolocation.watchPosition(p => { this.latestPosition = p; });
    }
    if (!this.locationTimer) {
      this.locationTimer = setInterval(() => this.sendLatestLocation(), 5000);
      this.sendLatestLocation();
    }
  }

  private stopLocationStreaming(): void {
    this.streaming = false;
    this.webSocketService.disconnectDriverPublisher();
    if (this.locationWatchId !== null) { navigator.geolocation.clearWatch(this.locationWatchId); this.locationWatchId = null; }
    if (this.locationTimer) { clearInterval(this.locationTimer); this.locationTimer = null; }
  }

  private sendLatestLocation(): void {
    if (!this.streaming || !this.driverId || !this.latestPosition) return;
    const { latitude, longitude } = this.latestPosition.coords;
    const sent = this.webSocketService.sendDriverLocation(latitude, longitude);
    if (!sent) this.driverService.pushLocation(this.driverId, latitude, longitude).subscribe({ error: () => {} });
  }
}

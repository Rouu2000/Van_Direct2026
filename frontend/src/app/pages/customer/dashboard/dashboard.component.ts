import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ShipmentService } from '../../../services/shipment.service';

const STATUS_STEP: Record<string, number> = {
  BOOKED: 0, DRIVER_ASSIGNED: 1, PICKED_UP: 2, DELIVERED: 3, CANCELLED: -1
};

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {
  userName = 'Customer';
  shipments: any[] = [];
  loading = true;
  error: string | null = null;
  cancellingId: string | null = null;

  trackingQuery = '';
  trackedShipment: any | null = null;
  trackedDriver: any | null = null;
  trackError: string | null = null;

  readonly steps = ['Booked', 'Assigned', 'Picked Up', 'Delivered'];

  get activeCount()    { return this.shipments.filter(s => ['BOOKED','DRIVER_ASSIGNED','PICKED_UP'].includes(s.status)).length; }
  get deliveredCount() { return this.shipments.filter(s => s.status === 'DELIVERED').length; }

  constructor(private authService: AuthService, private shipmentService: ShipmentService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.authService.hydrateFromStorage();
    this.userName = this.authService.getUserName() || 'Customer';
    this.loadShipments();
  }

  loadShipments(): void {
    this.loading = true; this.error = null; this.cdr.markForCheck();
    this.shipmentService.getMyShipments().subscribe({
      next: d => { this.shipments = Array.isArray(d) ? d : []; this.loading = false; this.cdr.markForCheck(); },
      error: err => { this.error = err.error?.message || 'Failed to load shipments.'; this.shipments = []; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  canCancel(s: any): boolean { return s?.status === 'BOOKED' || s?.status === 'DRIVER_ASSIGNED'; }

  cancelShipment(id: string): void {
    if (!confirm('Cancel this shipment?')) return;
    this.cancellingId = id; this.cdr.markForCheck();
    this.shipmentService.cancelShipment(id).subscribe({
      next: () => { this.cancellingId = null; this.loadShipments(); },
      error: err => { this.cancellingId = null; alert(err.error?.message || 'Failed to cancel.'); this.cdr.markForCheck(); }
    });
  }

  onTrackSubmit(): void {
    if (!this.trackingQuery.trim()) return;
    this.trackError = null; this.trackedShipment = null; this.trackedDriver = null; this.cdr.markForCheck();
    this.shipmentService.trackShipment(this.trackingQuery.trim()).subscribe({
      next: res => { this.trackedShipment = res?.shipment || res; this.trackedDriver = res?.driver || null; this.cdr.markForCheck(); },
      error: () => { this.trackError = 'Shipment not found.'; this.cdr.markForCheck(); }
    });
  }

  isStepDone(status: string, stepIdx: number): boolean {
    const cur = STATUS_STEP[status] ?? -1;
    return cur > stepIdx;
  }

  isStepActive(status: string, stepIdx: number): boolean {
    const cur = STATUS_STEP[status] ?? -1;
    return cur === stepIdx;
  }
}

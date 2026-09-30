import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';
import { ShipmentService } from '../../../services/shipment.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {
  userName: string = 'Customer';
  shipments: any[] = [];
  loading = true;
  error: string | null = null;
  displayedColumns: string[] = ['trackingNumber', 'recipientName', 'parcelCount', 'status', 'priceAmount', 'actions'];

  trackingQuery = '';
  trackedShipment: any | null = null;
  trackedParcels: any[] = [];
  trackError: string | null = null;
  cancellingId: string | null = null;

  constructor(
    private authService: AuthService,
    private shipmentService: ShipmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.hydrateFromStorage();
    this.userName = this.authService.getUserName() || 'Customer';
    this.loadShipments();
  }

  loadShipments(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      this.shipmentService.getMyShipments().subscribe({
        next: (data) => {
          this.shipments = Array.isArray(data) ? data : [];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[CustomerDashboard] load failed:', err);
          this.error = err.error?.message || 'Failed to load shipments.';
          this.shipments = [];
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
    } catch (e: any) {
      this.error = e?.message || 'Please log in again.';
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  canCancel(shipment: any): boolean {
    return shipment?.status === 'BOOKED' || shipment?.status === 'DRIVER_ASSIGNED';
  }

  cancelShipment(id: string): void {
    if (!confirm('Cancel this shipment?')) return;
    this.cancellingId = id;
    this.cdr.markForCheck();

    this.shipmentService.cancelShipment(id).subscribe({
      next: () => {
        this.cancellingId = null;
        this.loadShipments();
      },
      error: (err) => {
        this.cancellingId = null;
        alert(err.error?.message || 'Failed to cancel shipment.');
        this.cdr.markForCheck();
      }
    });
  }

  onTrackSubmit(): void {
    if (!this.trackingQuery.trim()) return;
    this.trackError = null;
    this.trackedShipment = null;
    this.trackedParcels = [];
    this.cdr.markForCheck();

    this.shipmentService.trackShipment(this.trackingQuery.trim()).subscribe({
      next: (res) => {
        this.trackedShipment = res?.shipment || res;
        this.trackedParcels = res?.parcels || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.trackError = 'Shipment not found.';
        this.cdr.markForCheck();
      }
    });
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ShipmentService } from '../../services/shipment.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-shipment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './shipment-list.html',
  styleUrl: './shipment-list.css'
})
export class ShipmentListComponent implements OnInit {
  shipments: any[] = [];
  drivers: any[] = [];
  loading = true;
  error: string | null = null;
  selectedDriver: Record<string, string> = {};
  busyId: string | null = null;

  displayedColumns: string[] = [
    'trackingNumber',
    'recipientName',
    'serviceTier',
    'status',
    'priceAmount',
    'assign',
    'actions'
  ];

  statuses = ['BOOKED', 'DRIVER_ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];

  constructor(
    private shipmentService: ShipmentService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.shipmentService.getAll().subscribe({
      next: (data: any[]) => {
        this.shipments = Array.isArray(data) ? data : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load shipments.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    this.userService.getAllUsers().subscribe({
      next: (users: any[]) => {
        this.drivers = (users || []).filter(
          (u) => u.role === 'DRIVER' && u.status === 'ACTIVE'
        );
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  assignDriver(shipmentId: string): void {
    const driverId = this.selectedDriver[shipmentId];
    if (!driverId) {
      alert('Select a driver first.');
      return;
    }
    this.busyId = shipmentId;
    this.cdr.markForCheck();

    this.shipmentService.assignDriver(shipmentId, driverId).subscribe({
      next: () => {
        this.busyId = null;
        this.loadAll();
      },
      error: (err) => {
        this.busyId = null;
        alert(err.error?.message || 'Failed to assign driver.');
        this.cdr.markForCheck();
      }
    });
  }

  updateStatus(shipmentId: string, status: string): void {
    this.busyId = shipmentId;
    this.cdr.markForCheck();

    this.shipmentService.updateStatus(shipmentId, status).subscribe({
      next: () => {
        this.busyId = null;
        this.loadAll();
      },
      error: (err) => {
        this.busyId = null;
        alert(err.error?.message || 'Failed to update status.');
        this.cdr.markForCheck();
      }
    });
  }
}

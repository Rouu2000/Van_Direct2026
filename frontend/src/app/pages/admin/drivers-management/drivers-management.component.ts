import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-drivers-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './drivers-management.component.html',
  styleUrl: './drivers-management.component.css'
})
export class DriversManagementComponent implements OnInit {
  loading = true;
  drivers: any[] = [];
  displayedColumns: string[] = ['name', 'email', 'phone', 'status', 'vehicleType', 'actions'];

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDrivers();
  }

  loadDrivers(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.adminService.getAllDrivers().subscribe({
      next: (data) => {
        this.drivers = Array.isArray(data) ? data : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading drivers:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  activateDriver(driverId: string): void {
    if (!confirm('Activate this driver?')) return;

    this.adminService.activateDriver(driverId).subscribe({
      next: () => {
        this.loadDrivers();
      },
      error: (err) => {
        console.error('Error activating driver:', err);
        alert('Failed to activate driver');
      }
    });
  }

  suspendDriver(driverId: string): void {
    if (!confirm('Suspend this driver?')) return;

    this.adminService.suspendDriver(driverId).subscribe({
      next: () => {
        this.loadDrivers();
      },
      error: (err) => {
        console.error('Error suspending driver:', err);
        alert('Failed to suspend driver');
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return '#4caf50';
      case 'SUSPENDED': return '#f44336';
      case 'PENDING_APPROVAL': return '#ff9800';
      default: return '#9e9e9e';
    }
  }
}

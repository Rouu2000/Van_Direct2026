import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../services/user.service';
import { ShipmentService } from '../../services/shipment.service';
import { ParcelService } from '../../services/parcel.service';
import { AuthService } from '../../services/auth.service';
import { AdminService, AdminStatsSummary } from '../../services/admin.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  users: any[] = [];
  shipmentsCount: number = 0;
  parcelsCount: number = 0;
  loading = true;
  displayedColumns: string[] = ['name', 'email', 'phone', 'role', 'status'];

  // Admin KPI cards
  adminStats: AdminStatsSummary | null = null;

  constructor(
    private userService: UserService,
    private shipmentService: ShipmentService,
    private parcelService: ParcelService,
    public authService: AuthService,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.hydrateFromStorage();
    if (this.authService.isAdmin()) {
      this.loadAdminStats();
    } else {
      this.loadStats();
    }
  }

  loadAdminStats(): void {
    this.loading = true;
    this.adminService.getStatsSummary().subscribe({
      next: (stats) => {
        this.adminStats = stats;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Error fetching admin stats:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadStats(): void {
    this.loading = true;
    let pending = 3;
    const done = () => {
      pending -= 1;
      if (pending <= 0) {
        this.loading = false;
        this.cdr.markForCheck();
      }
    };

    this.userService.getAllUsers().subscribe({
      next: (data: any[]) => {
        this.users = Array.isArray(data) ? data : [];
        this.cdr.markForCheck();
        done();
      },
      error: (err: any) => {
        console.error('Error fetching users:', err);
        done();
      }
    });

    this.shipmentService.getAll().subscribe({
      next: (data: any[]) => {
        this.shipmentsCount = Array.isArray(data) ? data.length : 0;
        this.cdr.markForCheck();
        done();
      },
      error: (err: any) => {
        console.error('Error fetching shipments:', err);
        done();
      }
    });

    this.parcelService.getAll().subscribe({
      next: (data: any[]) => {
        this.parcelsCount = Array.isArray(data) ? data.length : 0;
        this.cdr.markForCheck();
        done();
      },
      error: (err: any) => {
        console.error('Error fetching parcels:', err);
        done();
      }
    });
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-pending-drivers',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './pending-drivers.html',
  styleUrl: './pending-drivers.css',
})
export class PendingDriversComponent implements OnInit {
  drivers: any[] = [];
  loading = true;
  error: string | null = null;
  displayedColumns: string[] = ['name', 'email', 'phone', 'vehicleType', 'licenseNumber', 'actions'];

  private readonly apiUrl = `${environment.apiUrl}/api/admin/drivers/pending`;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDrivers();
  }

  loadDrivers(): void {
    this.loading = true;
    this.error = null;
    console.log('[PendingDrivers] Calling API:', this.apiUrl);

    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        console.log('[PendingDrivers] API response:', data);
        this.drivers = Array.isArray(data) ? data : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[PendingDrivers] Failed to load pending drivers:', err);
        this.error = err?.error?.message || 'Failed to load pending drivers.';
        this.drivers = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  approveDriver(id: string): void {
    console.log('[PendingDrivers] Approving driver:', id);
    this.http.put<any>(`${environment.apiUrl}/api/admin/drivers/${id}/approve`, {}).subscribe({
      next: (res) => {
        console.log('[PendingDrivers] Approved:', res);
        this.loadDrivers();
      },
      error: (err) => {
        console.error('[PendingDrivers] Failed to approve driver:', err);
        this.error = 'Failed to approve driver.';
        this.cdr.markForCheck();
      }
    });
  }

  suspendDriver(id: string): void {
    console.log('[PendingDrivers] Suspending driver:', id);
    this.http.put<any>(`${environment.apiUrl}/api/admin/drivers/${id}/suspend`, {}).subscribe({
      next: (res) => {
        console.log('[PendingDrivers] Suspended:', res);
        this.loadDrivers();
      },
      error: (err) => {
        console.error('[PendingDrivers] Failed to suspend driver:', err);
        this.error = 'Failed to suspend driver.';
        this.cdr.markForCheck();
      }
    });
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-pending-drivers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-drivers.html',
  styleUrl: './pending-drivers.css',
})
export class PendingDriversComponent implements OnInit {
  drivers: any[] = [];
  loading = true;
  error: string | null = null;

  private readonly base = `${environment.apiUrl}/api/admin/drivers`;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadDrivers(); }

  loadDrivers(): void {
    this.loading = true; this.error = null; this.cdr.markForCheck();
    this.http.get<any[]>(`${this.base}/pending`).subscribe({
      next: d => { this.drivers = Array.isArray(d) ? d : []; this.loading = false; this.cdr.markForCheck(); },
      error: err => { this.error = err?.error?.message || 'Failed to load.'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  approveDriver(id: string): void {
    this.http.put<any>(`${this.base}/${id}/approve`, {}).subscribe({ next: () => this.loadDrivers() });
  }

  suspendDriver(id: string): void {
    this.http.put<any>(`${this.base}/${id}/suspend`, {}).subscribe({ next: () => this.loadDrivers() });
  }
}

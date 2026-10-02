import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-drivers-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drivers-management.component.html',
  styleUrl: './drivers-management.component.css'
})
export class DriversManagementComponent implements OnInit {
  drivers: any[] = [];
  filtered: any[] = [];
  page: any[] = [];
  loading = true;
  searchQuery = '';
  statusFilter = '';
  readonly pageSize = 10;
  currentPage = 0;

  get totalPages() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get pageStart()  { return this.currentPage * this.pageSize; }
  get pageEnd()    { return Math.min(this.pageStart + this.pageSize, this.filtered.length); }

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadDrivers(); }

  loadDrivers(): void {
    this.loading = true; this.cdr.markForCheck();
    this.adminService.getAllDrivers().subscribe({
      next: d => { this.drivers = Array.isArray(d) ? d : []; this.applyFilters(); this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered = this.drivers.filter(d => {
      const ms = !this.statusFilter || d.status === this.statusFilter;
      const mq = !q || [d.name, d.email].some(v => v?.toLowerCase().includes(q));
      return ms && mq;
    });
    this.currentPage = 0; this.refreshPage();
  }

  setFilter(s: string): void { this.statusFilter = s; this.applyFilters(); }
  refreshPage(): void { this.page = this.filtered.slice(this.pageStart, this.pageEnd); }
  prevPage(): void { if (this.currentPage > 0) { this.currentPage--; this.refreshPage(); } }
  nextPage(): void { if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.refreshPage(); } }

  activateDriver(id: string): void {
    if (!confirm('Activate this driver?')) return;
    this.adminService.activateDriver(id).subscribe({ next: () => this.loadDrivers() });
  }

  suspendDriver(id: string): void {
    if (!confirm('Suspend this driver?')) return;
    this.adminService.suspendDriver(id).subscribe({ next: () => this.loadDrivers() });
  }

  vehicleIcon(v: string): string {
    return v === 'BIKE' ? 'pedal_bike' : v === 'CAR' ? 'directions_car' : 'local_shipping';
  }

  avatarColor(name: string): string {
    const colors = ['#1B3A6B','#C41E3A','#7C3AED','#0369A1','#15803D','#B45309'];
    const i = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[i];
  }
}

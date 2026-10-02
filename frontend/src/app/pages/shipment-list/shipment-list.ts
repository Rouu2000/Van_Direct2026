import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShipmentService } from '../../services/shipment.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-shipment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipment-list.html',
  styleUrl: './shipment-list.css'
})
export class ShipmentListComponent implements OnInit {
  shipments: any[] = [];
  filtered: any[] = [];
  page: any[] = [];
  drivers: any[] = [];
  loading = true;
  error: string | null = null;
  busyId: string | null = null;
  selectedDriver: Record<string, string> = {};

  searchQuery = '';
  statusFilter = '';
  sortCol = '';
  sortDir: 'asc' | 'desc' = 'asc';

  readonly pageSize = 10;
  currentPage = 0;

  get totalPages() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get pageStart()  { return this.currentPage * this.pageSize; }
  get pageEnd()    { return Math.min(this.pageStart + this.pageSize, this.filtered.length); }

  constructor(
    private shipmentService: ShipmentService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true; this.error = null; this.cdr.markForCheck();

    this.shipmentService.getAll().subscribe({
      next: (data: any[]) => {
        this.shipments = Array.isArray(data) ? data : [];
        this.applyFilters();
        this.loading = false; this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load shipments.';
        this.loading = false; this.cdr.markForCheck();
      }
    });

    this.userService.getAllUsers().subscribe({
      next: (users: any[]) => {
        this.drivers = (users || []).filter(u => u.role === 'DRIVER' && u.status === 'ACTIVE');
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.shipments.filter(s => {
      const matchStatus = !this.statusFilter || s.status === this.statusFilter;
      const matchSearch = !q || [s.trackingNumber, s.recipientName, s.pickupAddress, s.dropoffAddress]
        .some(v => v?.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
    if (this.sortCol) {
      this.filtered.sort((a, b) => {
        const va = a[this.sortCol] ?? '';
        const vb = b[this.sortCol] ?? '';
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
        return this.sortDir === 'asc' ? cmp : -cmp;
      });
    }
    this.currentPage = 0;
    this.refreshPage();
  }

  setFilter(s: string): void { this.statusFilter = s; this.applyFilters(); }

  sort(col: string): void {
    if (this.sortCol === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.sortCol = col; this.sortDir = 'asc'; }
    this.applyFilters();
  }

  getSortIcon(col: string): string {
    if (this.sortCol !== col) return '↕';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  refreshPage(): void {
    this.page = this.filtered.slice(this.pageStart, this.pageEnd);
  }

  prevPage(): void { if (this.currentPage > 0) { this.currentPage--; this.refreshPage(); } }
  nextPage(): void { if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.refreshPage(); } }

  assignDriver(shipmentId: string): void {
    const driverId = this.selectedDriver[shipmentId];
    if (!driverId) return;
    this.busyId = shipmentId; this.cdr.markForCheck();
    this.shipmentService.assignDriver(shipmentId, driverId).subscribe({
      next: () => { this.busyId = null; this.loadAll(); },
      error: (err) => { this.busyId = null; alert(err.error?.message || 'Failed to assign driver.'); this.cdr.markForCheck(); }
    });
  }

  updateStatus(shipmentId: string, status: string): void {
    this.busyId = shipmentId; this.cdr.markForCheck();
    this.shipmentService.updateStatus(shipmentId, status).subscribe({
      next: () => { this.busyId = null; this.loadAll(); },
      error: (err) => { this.busyId = null; alert(err.error?.message || 'Failed to update status.'); this.cdr.markForCheck(); }
    });
  }
}

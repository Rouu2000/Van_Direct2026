import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminService, AdminStatsSummary, DailyStats } from '../../../services/admin.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStatsSummary | null = null;
  totalUsers: number | null = null;
  pendingDrivers: number | null = null;

  loading = true;
  statsError: string | null = null;
  chartLoading = true;
  chartError: string | null = null;

  readonly today = new Date();

  shipmentChartData: ChartData<'bar'> = {
    labels: [], datasets: [{ data: [], label: 'Shipments', backgroundColor: '#C41E3A', borderRadius: 6 }]
  };
  revenueChartData: ChartData<'line'> = {
    labels: [], datasets: [{ data: [], label: 'Revenue (€)', borderColor: '#1B3A6B', backgroundColor: 'rgba(27,58,107,.1)', fill: true, tension: 0.4, pointRadius: 3 }]
  };
  readonly chartOptions: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { family: 'Inter' } } },
      x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } }
    }
  };
  readonly lineChartOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { family: 'Inter' } } },
      x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } }
    }
  };

  constructor(
    private adminService: AdminService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadKpis();
    this.loadCharts();
  }

  loadKpis(): void {
    this.loading = true;
    this.statsError = null;
    this.cdr.markForCheck();

    forkJoin({
      summary: this.adminService.getStatsSummary().pipe(
        catchError(err => { throw err; })
      ),
      users: this.http.get<any[]>(`${environment.apiUrl}/api/users`).pipe(
        catchError(() => of(null))
      ),
      pending: this.http.get<any[]>(`${environment.apiUrl}/api/admin/drivers/pending`).pipe(
        catchError(() => of(null))
      )
    }).subscribe({
      next: ({ summary, users, pending }) => {
        this.stats = summary;
        this.totalUsers = Array.isArray(users) ? users.length : null;
        this.pendingDrivers = Array.isArray(pending) ? pending.length : null;
        this.loading = false;
        this.statsError = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.statsError = err?.status === 401
          ? 'Authentication error — please log in again.'
          : err?.status === 403
          ? 'Access denied. Admin role required.'
          : `Failed to load dashboard data (HTTP ${err?.status ?? 'unknown'}). Is the backend running?`;
        this.cdr.markForCheck();
      }
    });
  }

  loadCharts(): void {
    this.chartLoading = true;
    this.chartError = null;

    forkJoin({
      shipments: this.adminService.getShipmentStats('week').pipe(catchError(() => of(null))),
      revenue:   this.adminService.getRevenueStats('week').pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ shipments, revenue }) => {
        if (Array.isArray(shipments)) {
          this.shipmentChartData = {
            labels: shipments.map((r: DailyStats) => this.fmtDate(r.date)),
            datasets: [{ data: shipments.map((r: DailyStats) => r.count ?? 0), label: 'Shipments', backgroundColor: '#C41E3A', borderRadius: 6 }]
          };
        } else {
          this.chartError = 'Chart data unavailable.';
        }
        if (Array.isArray(revenue)) {
          this.revenueChartData = {
            labels: revenue.map((r: DailyStats) => this.fmtDate(r.date)),
            datasets: [{ data: revenue.map((r: DailyStats) => r.revenue ?? 0), label: 'Revenue (€)', borderColor: '#1B3A6B', backgroundColor: 'rgba(27,58,107,.1)', fill: true, tension: 0.4, pointRadius: 3 }]
          };
        }
        this.chartLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.chartLoading = false;
        this.chartError = 'Failed to load chart data.';
        this.cdr.markForCheck();
      }
    });
  }

  private fmtDate(d: string): string {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
}

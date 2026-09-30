import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { AdminService, DailyStats, DeliveryTimeStats } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-charts',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BaseChartDirective
  ],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css'
})
export class AdminChartsComponent implements OnInit {
  range: 'week' | 'month' = 'week';
  loading = true;

  shipmentStats: DailyStats[] = [];
  revenueStats: DailyStats[] = [];
  deliveryTimeStats: DeliveryTimeStats | null = null;

  // Chart.js data and options for Shipments
  shipmentChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Shipments',
        data: [],
        fill: true,
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63,81,181,0.1)',
        tension: 0.3
      }
    ]
  };

  shipmentChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };

  // Chart.js data and options for Revenue
  revenueChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Revenue ($)',
        data: [],
        fill: true,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76,175,80,0.1)',
        tension: 0.3
      }
    ]
  };

  revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadChartData();
  }

  setRange(newRange: 'week' | 'month'): void {
    this.range = newRange;
    this.loadChartData();
  }

  loadChartData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.adminService.getShipmentStats(this.range).subscribe({
      next: (data) => {
        this.shipmentStats = data;
        this.shipmentChartData = {
          labels: data.map(d => this.formatDate(d.date)),
          datasets: [
            {
              label: 'Shipments',
              data: data.map(d => d.count ?? 0),
              fill: true,
              borderColor: '#3f51b5',
              backgroundColor: 'rgba(63,81,181,0.1)',
              tension: 0.3
            }
          ]
        };
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading shipment stats:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    this.adminService.getRevenueStats(this.range).subscribe({
      next: (data) => {
        this.revenueStats = data;
        this.revenueChartData = {
          labels: data.map(d => this.formatDate(d.date)),
          datasets: [
            {
              label: 'Revenue ($)',
              data: data.map(d => d.revenue ?? 0),
              fill: true,
              borderColor: '#4caf50',
              backgroundColor: 'rgba(76,175,80,0.1)',
              tension: 0.3
            }
          ]
        };
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading revenue stats:', err);
        this.cdr.markForCheck();
      }
    });

    this.adminService.getDeliveryTimeStats().subscribe({
      next: (data) => {
        this.deliveryTimeStats = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading delivery time stats:', err);
        this.cdr.markForCheck();
      }
    });
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

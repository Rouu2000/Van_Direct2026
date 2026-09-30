import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminStatsSummary {
  totalShipments: number;
  deliveredToday: number;
  activeDrivers: number;
  totalRevenue: number;
  cancellationRate: number;
}

export interface DailyStats {
  date: string;
  count: number;
  revenue?: number;
}

export interface DeliveryTimeStats {
  overallAverageMinutes: number;
  averageByServiceTier: { [key: string]: number };
}

export interface LiveShipment {
  id: string;
  trackingNumber: string;
  status: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  assignedDriverId?: string;
  driverLat?: number;
  driverLng?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private baseUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getStatsSummary(): Observable<AdminStatsSummary> {
    return this.http.get<AdminStatsSummary>(`${this.baseUrl}/stats/summary`);
  }

  getShipmentStats(range: 'week' | 'month' = 'week'): Observable<DailyStats[]> {
    return this.http.get<DailyStats[]>(`${this.baseUrl}/stats/shipments?range=${range}`);
  }

  getRevenueStats(range: 'week' | 'month' = 'week'): Observable<DailyStats[]> {
    return this.http.get<DailyStats[]>(`${this.baseUrl}/stats/revenue?range=${range}`);
  }

  getDeliveryTimeStats(): Observable<DeliveryTimeStats> {
    return this.http.get<DeliveryTimeStats>(`${this.baseUrl}/stats/delivery-times`);
  }

  getLiveShipments(): Observable<LiveShipment[]> {
    return this.http.get<LiveShipment[]>(`${this.baseUrl}/shipments/live`);
  }

  getAllDrivers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/drivers`);
  }

  activateDriver(driverId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/drivers/${driverId}/activate`, {});
  }

  suspendDriver(driverId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/drivers/${driverId}/suspend`, {});
  }
}

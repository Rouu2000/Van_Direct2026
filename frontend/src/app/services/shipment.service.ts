import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  private baseUrl = `${environment.apiUrl}/api/shipments`;
  private customersUrl = `${environment.apiUrl}/api/customers`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  createShipment(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  /** @deprecated use createShipment */
  create(shipment: any): Observable<any> {
    return this.createShipment(shipment);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  getMyShipments(): Observable<any[]> {
    const id = this.authService.getUserId();
    if (!id) {
      throw new Error('User not logged in');
    }
    return this.http.get<any[]>(`${this.customersUrl}/${id}/shipments`);
  }

  getCustomerShipments(customerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.customersUrl}/${customerId}/shipments`);
  }

  trackShipment(trackingNumber: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/track/${trackingNumber}`);
  }

  /** @deprecated use trackShipment */
  track(trackingNumber: string): Observable<any> {
    return this.trackShipment(trackingNumber);
  }

  cancelShipment(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/cancel`, {});
  }

  updateStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/status`, { status });
  }

  assignDriver(shipmentId: string, driverId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${shipmentId}/assign`, { driverId });
  }

  autoAssign(shipmentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${shipmentId}/assign`, {});
  }

  getDriverLocation(shipmentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${shipmentId}/driverlocation`);
  }

  estimatePrice(data: {
    serviceTier: string;
    pickupLat: number | null;
    pickupLng: number | null;
    dropoffLat: number | null;
    dropoffLng: number | null;
    parcels: Array<{ weightKg: number; sizeCategory: string }>;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/estimate`, data);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DriverService {
  private readonly driversUrl = `${environment.apiUrl}/api/drivers`;
  private readonly shipmentsUrl = `${environment.apiUrl}/api/shipments`;

  constructor(private http: HttpClient) {}

  setAvailability(driverId: string, status: 'AVAILABLE' | 'UNAVAILABLE' | 'OFFLINE'): Observable<any> {
    return this.http.put(`${this.driversUrl}/${driverId}/availability`, { status });
  }

  getDeliveries(driverId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.driversUrl}/${driverId}/deliveries`);
  }

  acceptShipment(shipmentId: string): Observable<any> {
    return this.http.put(`${this.shipmentsUrl}/${shipmentId}/accept`, {});
  }

  declineShipment(shipmentId: string): Observable<any> {
    return this.http.put(`${this.shipmentsUrl}/${shipmentId}/decline`, {});
  }

  updateShipmentStatus(shipmentId: string, status: 'PICKED_UP' | 'DELIVERED'): Observable<any> {
    return this.http.put(`${this.shipmentsUrl}/${shipmentId}/status`, { status });
  }

  pushLocation(driverId: string, lat: number, lng: number): Observable<any> {
    return this.http.post(`${this.driversUrl}/${driverId}/location`, { lat, lng });
  }
}

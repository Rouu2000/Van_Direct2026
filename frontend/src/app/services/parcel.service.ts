import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ParcelService {
  private baseUrl = `${environment.apiUrl}/api/parcels`;

  constructor(private http: HttpClient) {}

  create(parcel: any): Observable<any> {
    return this.http.post(this.baseUrl, parcel);
  }

  getAll(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  getByShipmentId(shipmentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/shipment/${shipmentId}`);
  }
}

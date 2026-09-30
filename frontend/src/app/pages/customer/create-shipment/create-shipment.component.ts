import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { ShipmentService } from '../../../services/shipment.service';

export interface ParcelDraft {
  weightKg: number | null;
  sizeCategory: string;
  description: string;
  declaredValue: number | null;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

@Component({
  selector: 'app-create-shipment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatRadioModule
  ],
  templateUrl: './create-shipment.component.html',
  styleUrls: ['./create-shipment.component.css']
})
export class CreateShipmentComponent implements OnInit, OnDestroy {
  step = 1;
  loading = false;
  geocoding = false;
  error: string | null = null;
  createdTrackingNumber: string | null = null;
  estimatedTotal = 0;
  estimatedDistanceKm = 0;

  form = {
    customerId: '',
    pickupAddress: '',
    pickupLat: null as number | null,
    pickupLng: null as number | null,
    recipientName: '',
    recipientPhone: '',
    dropoffAddress: '',
    dropoffLat: null as number | null,
    dropoffLng: null as number | null,
    serviceTier: 'STANDARD'
  };

  parcels: ParcelDraft[] = [
    { weightKg: 1, sizeCategory: 'SMALL', description: '', declaredValue: null }
  ];

  private pickupAddress$ = new Subject<string>();
  private dropoffAddress$ = new Subject<string>();
  private subs = new Subscription();

  constructor(
    private authService: AuthService,
    private shipmentService: ShipmentService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.hydrateFromStorage();
    this.form.customerId = this.authService.getUserId() || '';

    this.subs.add(
      this.pickupAddress$.pipe(
        debounceTime(600),
        distinctUntilChanged(),
        switchMap(q => this.geocode(q, 'pickup'))
      ).subscribe()
    );
    this.subs.add(
      this.dropoffAddress$.pipe(
        debounceTime(600),
        distinctUntilChanged(),
        switchMap(q => this.geocode(q, 'dropoff'))
      ).subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onPickupAddressChange(value: string): void {
    this.form.pickupAddress = value;
    this.form.pickupLat = null;
    this.form.pickupLng = null;
    this.pickupAddress$.next(value?.trim() || '');
  }

  onDropoffAddressChange(value: string): void {
    this.form.dropoffAddress = value;
    this.form.dropoffLat = null;
    this.form.dropoffLng = null;
    this.dropoffAddress$.next(value?.trim() || '');
  }

  private geocode(query: string, kind: 'pickup' | 'dropoff') {
    if (!query) {
      return of([]);
    }
    this.geocoding = true;
    this.cdr.markForCheck();
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    return this.http.get<NominatimResult[]>(url).pipe(
      catchError(() => of([] as NominatimResult[])),
      switchMap(results => {
        this.geocoding = false;
        if (!results?.length) {
          this.error = `Address not found: ${query}`;
          if (kind === 'pickup') {
            this.form.pickupLat = null;
            this.form.pickupLng = null;
          } else {
            this.form.dropoffLat = null;
            this.form.dropoffLng = null;
          }
        } else {
          this.error = null;
          const lat = Number(results[0].lat);
          const lng = Number(results[0].lon);
          if (kind === 'pickup') {
            this.form.pickupLat = lat;
            this.form.pickupLng = lng;
          } else {
            this.form.dropoffLat = lat;
            this.form.dropoffLng = lng;
          }
          this.refreshEstimate();
        }
        this.cdr.markForCheck();
        return of(results);
      })
    );
  }

  refreshEstimate(): void {
    if (!this.canGoStep3() && this.step < 3) {
      return;
    }
    this.shipmentService.estimatePrice({
      serviceTier: this.form.serviceTier,
      pickupLat: this.form.pickupLat,
      pickupLng: this.form.pickupLng,
      dropoffLat: this.form.dropoffLat,
      dropoffLng: this.form.dropoffLng,
      parcels: this.parcels.map(p => ({
        weightKg: Number(p.weightKg) || 0,
        sizeCategory: p.sizeCategory
      }))
    }).subscribe({
      next: (res) => {
        this.estimatedTotal = Number(res?.priceAmount) || 0;
        this.estimatedDistanceKm = Number(res?.distanceKm) || 0;
        this.cdr.markForCheck();
      },
      error: () => {
        this.estimatedTotal = 0;
        this.cdr.markForCheck();
      }
    });
  }

  addParcel(): void {
    this.parcels.push({ weightKg: 1, sizeCategory: 'SMALL', description: '', declaredValue: null });
    this.refreshEstimate();
    this.cdr.markForCheck();
  }

  removeParcel(index: number): void {
    if (this.parcels.length > 1) {
      this.parcels.splice(index, 1);
      this.refreshEstimate();
      this.cdr.markForCheck();
    }
  }

  canGoStep2(): boolean {
    return !!(
      this.form.pickupAddress?.trim() &&
      this.form.recipientName?.trim() &&
      this.form.recipientPhone?.trim() &&
      this.form.dropoffAddress?.trim()
    );
  }

  canGoStep3(): boolean {
    return this.parcels.every(
      p => p.weightKg && p.weightKg > 0 && p.sizeCategory && p.description?.trim()
    );
  }

  nextStep(): void {
    this.error = null;
    if (this.step === 1) {
      if (!this.canGoStep2()) {
        this.error = 'Please fill in pickup and recipient details.';
        this.cdr.markForCheck();
        return;
      }
      if (this.form.pickupLat == null || this.form.pickupLng == null) {
        this.error = 'Pickup address could not be found. Please refine it.';
        this.cdr.markForCheck();
        return;
      }
      if (this.form.dropoffLat == null || this.form.dropoffLng == null) {
        this.error = 'Drop-off address could not be found. Please refine it.';
        this.cdr.markForCheck();
        return;
      }
    }
    if (this.step === 2 && !this.canGoStep3()) {
      this.error = 'Each parcel needs weight, size, and description.';
      this.cdr.markForCheck();
      return;
    }
    this.step += 1;
    if (this.step === 3 || this.step === 4) {
      this.refreshEstimate();
    }
    this.cdr.markForCheck();
  }

  prevStep(): void {
    this.error = null;
    if (this.step > 1) {
      this.step -= 1;
      this.cdr.markForCheck();
    }
  }

  onServiceTierChange(): void {
    this.refreshEstimate();
  }

  confirm(): void {
    this.error = null;
    if (!this.form.customerId) {
      this.error = 'You must be logged in as a customer.';
      this.cdr.markForCheck();
      return;
    }
    if (this.form.pickupLat == null || this.form.dropoffLat == null) {
      this.error = 'Addresses must be geocoded before booking.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const payload = {
      customerId: this.form.customerId,
      pickupAddress: this.form.pickupAddress,
      pickupLat: this.form.pickupLat,
      pickupLng: this.form.pickupLng,
      recipientName: this.form.recipientName,
      recipientPhone: this.form.recipientPhone,
      dropoffAddress: this.form.dropoffAddress,
      dropoffLat: this.form.dropoffLat,
      dropoffLng: this.form.dropoffLng,
      serviceTier: this.form.serviceTier,
      parcels: this.parcels.map(p => ({
        weightKg: p.weightKg,
        sizeCategory: p.sizeCategory,
        description: p.description,
        declaredValue: p.declaredValue
      }))
    };

    this.shipmentService.createShipment(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.createdTrackingNumber = res?.shipment?.trackingNumber || res?.trackingNumber || null;
        this.step = 5;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to create shipment.';
        this.cdr.markForCheck();
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/customer/dashboard']);
  }
}

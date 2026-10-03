import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit,
  ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import * as L from 'leaflet';
import { environment } from '../../../environments/environment';

export interface AddressData {
  contactName:  string;
  company:      string;
  phone:        string;
  email:        string;
  line1:        string;
  line2:        string;
  postalCode:   string;
  province:     string;
  city:         string;
  residential:  boolean;
  lat:          number | null;
  lng:          number | null;
  geoAccuracy:  'ADDRESS' | 'POSTAL_CODE' | 'CITY' | 'MANUAL' | 'NONE' | null;
}

export const PROVINCES = [
  'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'
];

const CITY_SUGGESTIONS: Record<string, string[]> = {
  ON: ['Ottawa','Kanata','Nepean','Orleans','Barrhaven','Stittsville','Vanier','Gatineau','Toronto','Mississauga','Hamilton','London','Brampton'],
  QC: ['Gatineau','Montreal','Quebec City','Laval','Longueuil','Sherbrooke','Trois-Rivières'],
};

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressFormComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input()  heading     = 'Address';
  @Input()  requireEmail = false;
  @Input()  mapId       = 'addr-map-' + Math.random().toString(36).slice(2);
  @Output() changed     = new EventEmitter<AddressData>();

  readonly provinces = PROVINCES;
  citySuggestions: string[] = [];
  showSuggestions = false;

  data: AddressData = {
    contactName: '', company: '', phone: '', email: '',
    line1: '', line2: '', postalCode: '', province: 'ON', city: 'Ottawa',
    residential: false, lat: null, lng: null, geoAccuracy: null
  };

  geocoding = false;
  geoMsg    = '';

  private map: L.Map | null = null;
  private pin: L.Marker | null = null;
  private geocodeSubject = new Subject<void>();
  private subs = new Subscription();

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateCitySuggestions();
    // Debounced geocode: fires 800ms after any address field changes
    this.subs.add(
      this.geocodeSubject.pipe(
        debounceTime(800),
        distinctUntilChanged(),
        switchMap(() => this.runGeocode())
      ).subscribe()
    );
  }

  ngAfterViewInit(): void {
    // Small delay to ensure the DOM element exists (may be inside *ngIf)
    setTimeout(() => this.initMap(), 200);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.map) { this.map.remove(); this.map = null; }
  }

  // ── Field change handlers ──────────────────────────────────
  onProvinceChange(): void {
    this.updateCitySuggestions();
    this.scheduleGeocode();
  }

  onCityInput(val: string): void {
    this.data.city = val;
    const lc = val.toLowerCase();
    const list = CITY_SUGGESTIONS[this.data.province] ?? [];
    this.citySuggestions = list.filter(c => c.toLowerCase().startsWith(lc));
    this.showSuggestions = this.citySuggestions.length > 0 && val.length > 0;
    this.scheduleGeocode();
  }

  selectCity(c: string): void {
    this.data.city = c;
    this.showSuggestions = false;
    this.scheduleGeocode();
    this.cdr.markForCheck();
  }

  scheduleGeocode(): void {
    this.geocodeSubject.next();
    this.emit();
  }

  private updateCitySuggestions(): void {
    this.citySuggestions = CITY_SUGGESTIONS[this.data.province] ?? [];
    if (!this.citySuggestions.includes(this.data.city)) {
      this.data.city = this.citySuggestions[0] ?? '';
    }
  }

  // ── Geocoding ──────────────────────────────────────────────
  private runGeocode() {
    const { line1, city, province, postalCode } = this.data;
    if (!city && !postalCode) return of(null);

    this.geocoding = true;
    this.geoMsg = '';
    this.cdr.markForCheck();

    return this.http.post<any>(`${environment.apiUrl}/api/geocode`, {
      line1, city, province, postalCode
    }).pipe(
      catchError(() => of({ lat: null, lng: null, accuracy: 'NONE' }))
    ).pipe(
      switchMap(res => {
        this.geocoding = false;
        if (res?.lat != null && res?.lng != null) {
          this.data.lat = res.lat;
          this.data.lng = res.lng;
          this.data.geoAccuracy = res.accuracy;
          this.geoMsg = this.accuracyLabel(res.accuracy);
          this.updatePin(res.lat, res.lng);
        } else {
          this.data.lat = null;
          this.data.lng = null;
          this.data.geoAccuracy = 'NONE';
          this.geoMsg = 'Location not found — pin will be approximate.';
        }
        this.cdr.markForCheck();
        this.emit();
        return of(null);
      })
    );
  }

  private accuracyLabel(acc: string): string {
    switch (acc) {
      case 'ADDRESS':     return 'Exact address located ✓';
      case 'POSTAL_CODE': return 'Approximate — based on postal code';
      case 'CITY':        return 'Approximate — based on city';
      default:            return '';
    }
  }

  // ── Map ────────────────────────────────────────────────────
  private initMap(): void {
    const el = document.getElementById(this.mapId);
    if (!el || this.map) return;
    this.map = L.map(el, { zoomControl: true, scrollWheelZoom: false })
                .setView([45.4215, -75.6972], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 19
    }).addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 150);
  }

  private updatePin(lat: number, lng: number): void {
    if (!this.map) { this.initMap(); setTimeout(() => this.updatePin(lat, lng), 300); return; }
    if (this.pin) { this.pin.setLatLng([lat, lng]); }
    else {
      this.pin = L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.pin.on('dragend', () => {
        const ll = this.pin!.getLatLng();
        this.data.lat = ll.lat;
        this.data.lng = ll.lng;
        this.data.geoAccuracy = 'MANUAL';
        this.geoMsg = 'Position set manually';
        this.cdr.markForCheck();
        this.emit();
      });
    }
    this.map.setView([lat, lng], 15);
  }

  // ── Emit ───────────────────────────────────────────────────
  emit(): void {
    this.changed.emit({ ...this.data });
  }
}

/** Returns true if the component's required fields are all filled */
export function validateAddressData(d: AddressData, requireEmail: boolean): string | null {
  if (!d.contactName?.trim()) return 'Contact name is required.';
  if (!d.phone?.trim())       return 'Phone is required.';
  if (requireEmail && !d.email?.trim()) return 'Email is required for pickup.';
  if (!d.line1?.trim())       return 'Address line 1 is required.';
  if (!d.city?.trim())        return 'City is required.';
  if (!d.province?.trim())    return 'Province is required.';
  if (!d.postalCode?.trim())  return 'Postal code is required.';
  return null;
}

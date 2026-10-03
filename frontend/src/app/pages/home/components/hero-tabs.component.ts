import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-hero-tabs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './hero-tabs.component.html',
  styleUrl: './hero-tabs.component.css'
})
export class HeroTabsComponent {
  private router = inject(Router);
  private http   = inject(HttpClient);
  public  auth   = inject(AuthService);

  activeTab = signal<'estimate' | 'track' | 'ship'>('estimate');

  // Track tab
  trackingNumber = '';
  trackError = '';

  // Estimate tab
  est = {
    pickupCity:  '',
    dropoffCity: '',
    weightKg:    1,
    size:        'SMALL',
    tier:        'STANDARD'
  };
  estimateResult = signal<{price: number; distance: number} | null>(null);
  estimateError  = signal<string | null>(null);
  estimating     = signal(false);

  setTab(t: 'estimate' | 'track' | 'ship'): void { this.activeTab.set(t); }

  onTabKey(e: KeyboardEvent, t: 'estimate' | 'track' | 'ship'): void {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.setTab(t); }
    if (e.key === 'ArrowRight') { this.setTab(t === 'estimate' ? 'track' : t === 'track' ? 'ship' : 'estimate'); }
    if (e.key === 'ArrowLeft')  { this.setTab(t === 'ship' ? 'track' : t === 'track' ? 'estimate' : 'ship'); }
  }

  doTrack(): void {
    this.trackError = '';
    const tn = this.trackingNumber.trim();
    if (!tn) { this.trackError = 'Please enter a tracking number.'; return; }
    this.router.navigate(['/track'], { queryParams: { tn } });
  }

  doEstimate(): void {
    const { pickupCity, dropoffCity, weightKg, size, tier } = this.est;
    // Validate
    if (!pickupCity.trim() && !dropoffCity.trim()) {
      this.estimateError.set('Please enter at least a pickup city or postal code.');
      return;
    }
    if (!pickupCity.trim()) { this.estimateError.set('Please enter a pickup city.'); return; }
    if (!dropoffCity.trim()) { this.estimateError.set('Please enter a drop-off city.'); return; }
    const w = Number(weightKg);
    if (!weightKg || isNaN(w) || w < 0.1) { this.estimateError.set('Weight must be at least 0.1 kg.'); return; }
    if (w > 50) { this.estimateError.set('Weight must be at most 50 kg.'); return; }
    this.estimating.set(true);
    this.estimateError.set(null);
    this.estimateResult.set(null);

    // Use Nominatim to geocode cities, then call the public estimate endpoint
    const geocode = (q: string) =>
      this.http.get<any[]>(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Canada')}&format=json&limit=1&countrycodes=ca`).toPromise();

    Promise.all([geocode(pickupCity), geocode(dropoffCity)]).then(([pickup, dropoff]) => {
      const p = pickup?.[0];
      const d = dropoff?.[0];
      if (!p || !d) {
        this.estimateError.set('Could not find one or both cities. Try a more specific name.');
        this.estimating.set(false);
        return;
      }
      const body = {
        serviceTier: tier,
        pickupLat:  parseFloat(p.lat), pickupLng:  parseFloat(p.lon),
        dropoffLat: parseFloat(d.lat), dropoffLng: parseFloat(d.lon),
        parcels: [{ weightKg: Number(weightKg), sizeCategory: size }]
      };
      this.http.post<any>(`${environment.apiUrl}/api/shipments/estimate`, body)
        .subscribe({
          next: res => {
            this.estimateResult.set({ price: res.priceAmount, distance: res.distanceKm });
            this.estimating.set(false);
          },
          error: err => {
            this.estimateError.set(err?.error?.message || 'Estimate failed. Please try again.');
            this.estimating.set(false);
          }
        });
    }).catch(() => {
      this.estimateError.set('Geocoding service unavailable. Try again later.');
      this.estimating.set(false);
    });
  }

  get shipRoute(): string {
    if (!this.auth.isLoggedIn()) return '/login';
    if (this.auth.isCustomer()) return '/customer/shipments/new';
    return '/';
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({ selector: 'app-price-estimate', standalone: true,
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  template: `
<app-page-layout title="Price estimate" subtitle="Understand how VAN DIRECT pricing works before you book." eyebrow="Shipping">
  <div class="pe-grid">
    <div class="pe-card" *ngFor="let f of factors">
      <span class="material-icons pe-icon">{{ f.icon }}</span>
      <h3 class="pe-factor">{{ f.title }}</h3>
      <p class="pe-desc">{{ f.desc }}</p>
    </div>
  </div>
  <div class="pe-tiers">
    <div class="pe-tier">
      <h3>STANDARD</h3>
      <p>Base rate applies. Ideal for same-day or next-day deliveries that aren't time-critical.</p>
    </div>
    <div class="pe-tier pe-tier-featured">
      <h3>EXPRESS</h3>
      <p>A priority surcharge (1.5×) is applied. The nearest driver is dispatched immediately.</p>
    </div>
  </div>
  <div class="pe-cta">
    <p>The exact price is calculated live as you fill in your shipment details.</p>
    <a routerLink="/customer/shipments/new" class="btn btn-primary">Book and see the live price →</a>
  </div>
</app-page-layout>`,
  styles: [`
    .pe-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 20px; margin-bottom: 32px; }
    .pe-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px 20px; text-align: center; }
    .pe-icon { font-size: 32px; color: var(--brand); margin-bottom: 10px; }
    .pe-factor { font-size: .95rem; font-weight: 700; color: var(--text); margin-bottom: 6px; }
    .pe-desc   { font-size: .8rem; color: var(--text-muted); line-height: 1.6; }
    .pe-tiers  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
    @media (max-width: 480px) { .pe-tiers { grid-template-columns: 1fr; } }
    .pe-tier { background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius-lg); padding: 24px; }
    .pe-tier-featured { border-color: var(--brand); }
    .pe-tier h3 { font-size: 1.1rem; font-weight: 800; color: var(--navy); margin-bottom: 8px; }
    .pe-tier p  { font-size: .875rem; color: var(--text-muted); line-height: 1.6; }
    .pe-cta { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
    .pe-cta p { color: var(--text-2); font-size: .9rem; }
  `]
})
export class PriceEstimateComponent {
  factors = [
    { icon: 'straighten', title: 'Distance', desc: 'Calculated in km between pickup and drop-off using the Haversine formula.' },
    { icon: 'scale', title: 'Weight', desc: 'Each parcel weight in kg contributes to the total at a per-kg rate.' },
    { icon: 'inventory_2', title: 'Size category', desc: 'SMALL (1×), MEDIUM (1.5×), LARGE (2×) size multipliers are applied per parcel.' },
    { icon: 'bolt', title: 'Service tier', desc: 'STANDARD has a 1× multiplier; EXPRESS applies a 1.5× priority surcharge.' },
  ];
}

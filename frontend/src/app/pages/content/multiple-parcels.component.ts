import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({
  selector: 'app-multiple-parcels',
  standalone: true,
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  template: `
<app-page-layout
  title="Multiple parcels in one booking"
  subtitle="Bundle everything into a single shipment and pay one combined price."
  eyebrow="Shipping">

  <div class="mp-how">
    <h2 class="mp-h2">How it works</h2>
    <p>When you create a shipment, use the <strong>Add another parcel</strong> button to add as many packages as you need. Each parcel has its own weight, size category (SMALL / MEDIUM / LARGE) and declared value. The price is calculated from the total weight, sizes, distance and service tier — one booking, one driver, one delivery.</p>
  </div>

  <div class="mp-cards">
    <div *ngFor="let f of features" class="mp-card">
      <span class="material-icons mp-icon">{{ f.icon }}</span>
      <h3>{{ f.title }}</h3>
      <p>{{ f.body }}</p>
    </div>
  </div>

  <div class="mp-sizes">
    <h2 class="mp-h2">Parcel size categories</h2>
    <div class="mp-size-row" *ngFor="let s of sizes">
      <span class="mp-size-badge" [style.background]="s.color + '18'" [style.color]="s.color">{{ s.label }}</span>
      <span class="mp-size-desc">{{ s.desc }}</span>
      <span class="mp-size-mult">{{ s.mult }}× size multiplier</span>
    </div>
  </div>

  <div class="mp-cta">
    <a routerLink="/customer/shipments/new" class="btn btn-primary">Book a multi-parcel shipment →</a>
    <a routerLink="/price-estimate" class="btn btn-outline">See how pricing works</a>
  </div>
</app-page-layout>`,
  styles: [`
    .mp-how { margin-bottom: 32px; }
    .mp-h2  { font-size: 1.1rem; font-weight: 700; color: var(--navy); margin-bottom: 12px; }
    p { font-size: .95rem; color: var(--text-2); line-height: 1.8; }
    .mp-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 16px; margin-bottom: 32px; }
    .mp-card  { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; text-align: center; }
    .mp-icon  { font-size: 28px; color: var(--brand); margin-bottom: 10px; display: block; }
    .mp-card h3 { font-size: .9rem; font-weight: 700; margin-bottom: 6px; }
    .mp-card p  { font-size: .82rem; color: var(--text-muted); line-height: 1.6; }
    .mp-sizes   { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 28px; }
    .mp-size-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
    .mp-size-row:last-child { border-bottom: none; }
    .mp-size-badge { padding: 3px 10px; border-radius: var(--radius-pill); font-size: .75rem; font-weight: 700; white-space: nowrap; }
    .mp-size-desc  { flex: 1; font-size: .875rem; color: var(--text-2); }
    .mp-size-mult  { font-size: .8rem; color: var(--text-muted); white-space: nowrap; }
    .mp-cta { display: flex; gap: 12px; flex-wrap: wrap; }
  `]
})
export class MultipleParcelsComponent {
  features = [
    { icon: 'savings',       title: 'One combined price',   body: 'A single booking fee covers all parcels. Add as many as you need — no per-parcel surcharge.' },
    { icon: 'local_shipping',title: 'One driver, one trip',  body: 'All your parcels travel together to the same drop-off address, handled by the same vetted driver.' },
    { icon: 'edit_note',     title: 'Describe each parcel', body: 'Give each item its own description and declared value for a clear record if you ever need to raise a claim.' },
  ];
  sizes = [
    { label: 'SMALL',  color: '#2563EB', desc: 'Up to 30×20×15 cm, max 5 kg',   mult: '1.0' },
    { label: 'MEDIUM', color: '#D97706', desc: 'Up to 50×40×30 cm, max 15 kg',  mult: '1.5' },
    { label: 'LARGE',  color: '#C41E3A', desc: 'Up to 80×60×50 cm, max 30 kg',  mult: '2.0' },
  ];
}

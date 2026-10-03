import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({ selector: 'app-drop-off-points', standalone: true,
  imports: [CommonModule, PageLayoutComponent],
  template: `
<app-page-layout title="Drop-off points" subtitle="Leave your pre-labelled parcel at any VAN DIRECT partner location in the Ottawa region." eyebrow="Shipping">
  <p class="dop-note">⚠ These are placeholder locations — replace with real data before go-live.</p>
  <div class="dop-grid">
    <div *ngFor="let loc of locations" class="dop-card">
      <div class="dop-city">{{ loc.city }}</div>
      <h3 class="dop-name">{{ loc.name }}</h3>
      <p class="dop-addr">{{ loc.address }}</p>
      <p class="dop-hours"><span class="material-icons" style="font-size:14px;vertical-align:middle">schedule</span> {{ loc.hours }}</p>
    </div>
  </div>
</app-page-layout>`,
  styles: [`
    .dop-note { background: var(--warning-bg); color: var(--warning); padding: 10px 14px; border-radius: var(--radius-sm); font-size: .8rem; margin-bottom: 24px; }
    .dop-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 16px; }
    .dop-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
    .dop-city  { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--brand); margin-bottom: 4px; }
    .dop-name  { font-size: .95rem; font-weight: 700; margin-bottom: 6px; }
    .dop-addr  { font-size: .85rem; color: var(--text-2); line-height: 1.5; margin-bottom: 8px; }
    .dop-hours { font-size: .8rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
  `]
})
export class DropOffPointsComponent {
  locations = [
    { city: 'Ottawa',   name: 'Downtown Partner',        address: '123 Example Street, Ottawa, ON K1A 0B1',           hours: 'Mon–Sat 8am–8pm' },
    { city: 'Ottawa',   name: 'Kanata Relay',            address: '456 Sample Road, Kanata, ON K2K 0A1',              hours: 'Mon–Sat 9am–7pm' },
    { city: 'Ottawa',   name: "Barrhaven Drop-off",      address: '789 Placeholder Ave, Barrhaven, ON K2J 0B2',       hours: 'Mon–Fri 8am–6pm' },
    { city: 'Gatineau', name: 'Hull Centre Point',        address: '321 Test Boulevard, Gatineau, QC J8X 0A1',         hours: 'Mon–Sat 9am–7pm' },
    { city: 'Ottawa',   name: 'Orleans East Relay',       address: '654 Demo Lane, Orleans, ON K1C 0C3',               hours: 'Mon–Sat 8am–8pm' },
    { city: 'Ottawa',   name: "Nepean West Drop-off",     address: '987 Fictional Street, Nepean, ON K2H 0D4',         hours: 'Mon–Fri 8am–5pm' },
  ];
}

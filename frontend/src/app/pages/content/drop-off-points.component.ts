import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({ selector: 'app-drop-off-points', standalone: true,
  imports: [CommonModule, PageLayoutComponent],
  template: `
<app-page-layout title="Drop-off points" subtitle="Leave your pre-labelled parcel at any VAN DIRECT partner location." eyebrow="Shipping">
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
    { city:'Tunis',    name:'Centre Ville Partner',   address:'TODO: Avenue Habib Bourguiba, Tunis 1000',  hours:'Mon–Sat 8am–8pm' },
    { city:'Tunis',    name:'La Marsa Relais',         address:'TODO: Rue de la Plage, La Marsa 2078',      hours:'Mon–Sat 9am–7pm' },
    { city:'Sfax',     name:'Sfax Centre Logistique',  address:'TODO: Avenue Taïeb Mhiri, Sfax 3000',       hours:'Mon–Fri 8am–6pm' },
    { city:'Sousse',   name:'Sousse Médina Point',     address:'TODO: Rue de Paris, Sousse 4000',           hours:'Mon–Sat 9am–7pm' },
    { city:'Monastir', name:'Monastir Airport Relay',  address:'TODO: Zone Aéroportuaire, Monastir 5000',   hours:'Daily 7am–9pm'   },
    { city:'Béja',     name:'Béja Central Drop-off',   address:'TODO: Avenue Habib Chaker, Béja 9000',      hours:'Mon–Fri 8am–5pm' },
  ];
}

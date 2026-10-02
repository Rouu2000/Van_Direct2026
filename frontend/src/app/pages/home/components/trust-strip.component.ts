import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trust-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
<section class="ts-strip" aria-label="Why choose VAN DIRECT">
  <div class="ts-inner">
    <div *ngFor="let item of items; let last = last" class="ts-item" [class.ts-last]="last">
      <span class="ts-icon" [innerHTML]="item.svg" aria-hidden="true"></span>
      <div class="ts-text">
        <strong class="ts-title">{{ item.title }}</strong>
        <span class="ts-body">{{ item.body }}</span>
      </div>
    </div>
  </div>
</section>`,
  styles: [`
    .ts-strip { background: var(--surface-2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 40px 24px; }
    .ts-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); gap: 0; }
    .ts-item { display: flex; align-items: flex-start; gap: 14px; padding: 0 24px; border-right: 1px solid var(--border); }
    .ts-last  { border-right: none; }
    .ts-icon  { flex-shrink: 0; margin-top: 2px; }
    .ts-text  { display: flex; flex-direction: column; gap: 3px; }
    .ts-title { font-size: .9rem; font-weight: 700; color: var(--navy); }
    .ts-body  { font-size: .8rem; color: var(--text-muted); line-height: 1.5; }
    @media (max-width: 900px) {
      .ts-inner { grid-template-columns: 1fr 1fr; }
      .ts-item  { padding: 16px; border-right: none; border-bottom: 1px solid var(--border); }
      .ts-last  { border-bottom: none; }
      .ts-item:nth-child(odd) { border-right: 1px solid var(--border); }
    }
    @media (max-width: 480px) {
      .ts-inner { grid-template-columns: 1fr; }
      .ts-item:nth-child(odd) { border-right: none; }
    }
  `]
})
export class TrustStripComponent {
  items = [
    { title: 'Live GPS tracking',
      body: 'Follow your driver on the map, updated every 5 seconds.',
      svg: `<svg width="28" height="28" viewBox="0 0 24 24" fill="#C41E3A"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>` },
    { title: 'Careful handling',
      body: 'Every driver is vetted and rated. Your parcel is in safe hands.',
      svg: `<svg width="28" height="28" viewBox="0 0 24 24" fill="#C41E3A"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>` },
    { title: 'Instant notifications',
      body: 'In-app alerts at every status change — booked to delivered.',
      svg: `<svg width="28" height="28" viewBox="0 0 24 24" fill="#C41E3A"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>` },
    { title: 'Secure delivery',
      body: 'Digital delivery confirmation and end-to-end shipment record.',
      svg: `<svg width="28" height="28" viewBox="0 0 24 24" fill="#C41E3A"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>` },
  ];
}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({ selector: 'app-faq', standalone: true,
  imports: [CommonModule, PageLayoutComponent],
  template: `
<app-page-layout title="Frequently asked questions" subtitle="Everything you need to know about shipping with VAN DIRECT." eyebrow="Support">
  <div class="faq-list">
    <div *ngFor="let q of faqs; let i = index" class="faq-item">
      <button class="faq-q" (click)="toggle(i)" [attr.aria-expanded]="open() === i">
        <span>{{ q.q }}</span>
        <svg class="faq-icon" [class.open]="open() === i" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      <div class="faq-a" [class.visible]="open() === i" [attr.aria-hidden]="open() !== i">
        <p>{{ q.a }}</p>
      </div>
    </div>
  </div>
</app-page-layout>`,
  styles: [`
    .faq-list { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
    .faq-item { border-bottom: 1px solid var(--border); }
    .faq-item:last-child { border-bottom: none; }
    .faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; background: var(--surface); border: none; cursor: pointer; font-size: .95rem; font-weight: 600; color: var(--text); text-align: left; font-family: var(--font); transition: background 120ms; }
    .faq-q:hover { background: var(--surface-2); }
    .faq-icon { flex-shrink: 0; transition: transform 200ms; opacity: .5; }
    .faq-icon.open { transform: rotate(180deg); opacity: 1; }
    .faq-a { max-height: 0; overflow: hidden; transition: max-height 250ms ease; background: var(--surface-2); }
    .faq-a.visible { max-height: 300px; }
    .faq-a p { padding: 16px 20px 18px; font-size: .9rem; color: var(--text-2); line-height: 1.7; margin: 0; }
  `]
})
export class FaqComponent {
  open = signal<number | null>(null);
  toggle(i: number) { this.open.set(this.open() === i ? null : i); }
  faqs = [
    { q: 'How do I book a pickup?', a: 'Register or log in, go to "New Shipment", enter the pickup and drop-off addresses, add your parcels, choose a service tier and confirm. The system immediately looks for a driver near you.' },
    { q: 'How are drivers selected?', a: 'VAN DIRECT uses GPS to find the nearest available, approved driver. They have 30 seconds to accept. If they decline, the offer goes automatically to the next nearest driver.' },
    { q: 'What is the difference between STANDARD and EXPRESS?', a: 'STANDARD targets same-day or next-day delivery within the city. EXPRESS gives the shipment priority: a driver is dispatched within the hour and the fare reflects the urgency.' },
    { q: 'Can I send multiple parcels in one booking?', a: 'Yes. During the booking flow you can add as many parcels as you need, each with its own weight, size category and declared value. The price is calculated from the total.' },
    { q: 'How do I track my parcel?', a: 'Once a driver has been assigned you can open the tracking page (the link is in your notification) and watch the driver\'s GPS marker update every 5 seconds on a live map.' },
    { q: 'What happens if no driver is available?', a: 'Your shipment stays in BOOKED state. The system retries every 5 seconds. If a driver becomes available nearby they will be offered your shipment automatically.' },
    { q: 'Can I cancel a shipment?', a: 'Yes — as long as the status is BOOKED or DRIVER_ASSIGNED. Once a driver has picked up the parcel (PICKED_UP) it can no longer be cancelled. Go to your dashboard and click "Cancel" on the shipment.' },
    { q: 'What areas do you cover?', a: 'VAN DIRECT currently operates within the Ottawa–Gatineau region, including Ottawa, Kanata, Nepean, Barrhaven, Orleans, Stittsville, Vanier and Gatineau. Coverage is expanding — follow us on social media for updates.' },
  ];
}

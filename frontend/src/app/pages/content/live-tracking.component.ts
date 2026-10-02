import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({
  selector: 'app-live-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  template: `
<app-page-layout
  title="Live driver tracking"
  subtitle="Watch your driver move on the map in real time, updated every 5 seconds."
  eyebrow="Tracking">

  <div class="lt-steps">
    <div *ngFor="let s of steps; let i = index" class="lt-step">
      <div class="lt-num">{{ i + 1 }}</div>
      <div>
        <h3 class="lt-title">{{ s.title }}</h3>
        <p class="lt-body">{{ s.body }}</p>
      </div>
    </div>
  </div>

  <div class="lt-tech">
    <h2 class="lt-h2">How the live map works</h2>
    <p>Once a driver accepts your shipment, their device sends a GPS position to the VAN DIRECT server every 5 seconds via a WebSocket connection. The map on the tracking page receives those updates in real time and moves the driver marker smoothly. You always see where the driver is without refreshing the page.</p>
    <p style="margin-top:12px">The map is centred on Tunisia and uses OpenStreetMap tiles — no Google Maps account is required, and no data leaves the platform.</p>
  </div>

  <div class="lt-cta">
    <a routerLink="/track" class="btn btn-primary">Track a parcel now →</a>
    <a routerLink="/register" class="btn btn-outline">Create an account</a>
  </div>
</app-page-layout>`,
  styles: [`
    .lt-steps { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 32px; }
    .lt-step  { display: flex; align-items: flex-start; gap: 16px; padding: 20px; border-bottom: 1px solid var(--border); background: var(--surface); }
    .lt-step:last-child { border-bottom: none; }
    .lt-num   { width: 32px; height: 32px; border-radius: 50%; background: var(--brand); color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: .9rem; }
    .lt-title { font-size: .95rem; font-weight: 700; color: var(--text); margin-bottom: 4px; }
    .lt-body  { font-size: .875rem; color: var(--text-muted); line-height: 1.6; }
    .lt-tech  { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 28px; }
    .lt-h2    { font-size: 1rem; font-weight: 700; color: var(--navy); margin-bottom: 12px; }
    p { font-size: .9rem; color: var(--text-2); line-height: 1.8; }
    .lt-cta   { display: flex; gap: 12px; flex-wrap: wrap; }
  `]
})
export class LiveTrackingComponent {
  steps = [
    { title: 'Book a shipment',       body: 'Create your shipment and choose a service tier. The system assigns a driver within seconds.' },
    { title: 'Driver accepts',        body: 'Once a driver accepts the offer, the live map activates. You receive a notification with a direct tracking link.' },
    { title: 'Watch in real time',    body: 'Open the tracking page and see the driver\'s position update every 5 seconds. A pickup marker, a drop-off marker and a moving driver marker are shown on the map.' },
    { title: 'Delivery confirmed',    body: 'When the driver marks the shipment as Delivered, you and the recipient receive a confirmation notification with the delivery time.' },
  ];
}

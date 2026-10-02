import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({
  selector: 'app-in-app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  template: `
<app-page-layout
  title="In-app notifications"
  subtitle="Every status change on your shipment sends you an instant alert — no refreshing required."
  eyebrow="Tracking">

  <div class="ian-events">
    <h2 class="ian-h2">When do you get notified?</h2>
    <div class="ian-event" *ngFor="let e of events">
      <span class="status-chip" [attr.data-status]="e.status">{{ e.status }}</span>
      <p class="ian-desc">{{ e.desc }}</p>
    </div>
  </div>

  <div class="ian-where">
    <h2 class="ian-h2">Where do notifications appear?</h2>
    <div class="ian-card-grid">
      <div *ngFor="let c of channels" class="ian-card">
        <span class="material-icons ian-icon">{{ c.icon }}</span>
        <h3>{{ c.title }}</h3>
        <p>{{ c.body }}</p>
      </div>
    </div>
  </div>

  <div class="ian-cta">
    <a routerLink="/register" class="btn btn-primary">Create an account to get notified →</a>
  </div>
</app-page-layout>`,
  styles: [`
    .ian-h2    { font-size: 1rem; font-weight: 700; color: var(--navy); margin-bottom: 14px; }
    .ian-events{ margin-bottom: 32px; display: flex; flex-direction: column; gap: 0; border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
    .ian-event { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-bottom: 1px solid var(--border); background: var(--surface); flex-wrap: wrap; }
    .ian-event:last-child { border-bottom: none; }
    .ian-desc  { font-size: .875rem; color: var(--text-2); flex: 1; }
    .ian-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 16px; margin-bottom: 28px; }
    .ian-card  { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
    .ian-icon  { font-size: 26px; color: var(--brand); margin-bottom: 10px; display: block; }
    .ian-card h3 { font-size: .9rem; font-weight: 700; margin-bottom: 6px; }
    .ian-card p  { font-size: .82rem; color: var(--text-muted); line-height: 1.6; }
    .ian-where { margin-bottom: 28px; }
    .ian-cta   { }
    p { font-size: .9rem; color: var(--text-2); line-height: 1.8; }
  `]
})
export class InAppNotificationsComponent {
  events = [
    { status: 'DRIVER_ASSIGNED', desc: 'A driver has accepted your shipment and is heading to the pickup address.' },
    { status: 'PICKED_UP',       desc: 'The driver has collected your parcel and is on the way to the recipient.' },
    { status: 'DELIVERED',       desc: 'Your parcel has been delivered. The delivery time is recorded.' },
    { status: 'CANCELLED',       desc: 'The shipment has been cancelled (by you or the system if no driver was available).' },
  ];
  channels = [
    { icon: 'notifications', title: 'Bell icon in the header',    body: 'A red badge on the bell shows unread alerts. Click it to see the full list with titles and messages.' },
    { icon: 'dashboard',     title: 'Customer dashboard',         body: 'Your shipment cards update automatically to show the latest status.' },
    { icon: 'gps_fixed',     title: 'Tracking page',              body: 'The status banner and live map update in real time as long as the page is open.' },
  ];
}

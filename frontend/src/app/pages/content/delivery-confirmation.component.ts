import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({
  selector: 'app-delivery-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  template: `
<app-page-layout
  title="Delivery confirmation"
  subtitle="Know the moment your parcel arrives — with a timestamped record you can check any time."
  eyebrow="Tracking">

  <div class="dc-section">
    <h2 class="dc-h2">What you get when a shipment is delivered</h2>
    <div class="dc-items">
      <div *ngFor="let item of items" class="dc-item">
        <span class="material-icons dc-icon">{{ item.icon }}</span>
        <div>
          <h3 class="dc-item-title">{{ item.title }}</h3>
          <p class="dc-item-body">{{ item.body }}</p>
        </div>
      </div>
    </div>
  </div>

  <div class="dc-note">
    <span class="material-icons dc-note-icon">info_outline</span>
    <div>
      <strong>What is not included</strong>
      <p>VAN DIRECT does not currently collect a recipient signature or delivery photo. The delivery confirmation is based on the driver marking the shipment as Delivered in the app and the timestamp of that action.</p>
    </div>
  </div>

  <div class="dc-cta">
    <a routerLink="/track" class="btn btn-primary">Track a parcel →</a>
    <a routerLink="/faq" class="btn btn-outline">Read the FAQ</a>
  </div>
</app-page-layout>`,
  styles: [`
    .dc-section { margin-bottom: 28px; }
    .dc-h2 { font-size: 1rem; font-weight: 700; color: var(--navy); margin-bottom: 16px; }
    .dc-items { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
    .dc-item  { display: flex; align-items: flex-start; gap: 14px; padding: 18px 20px; border-bottom: 1px solid var(--border); background: var(--surface); }
    .dc-item:last-child { border-bottom: none; }
    .dc-icon  { font-size: 22px; color: var(--success); flex-shrink: 0; margin-top: 2px; }
    .dc-item-title { font-size: .9rem; font-weight: 700; margin-bottom: 4px; }
    .dc-item-body  { font-size: .85rem; color: var(--text-muted); line-height: 1.6; }
    .dc-note  { display: flex; align-items: flex-start; gap: 12px; background: var(--info-bg); border: 1px solid rgba(37,99,235,.2); border-radius: var(--radius-md); padding: 16px 20px; margin-bottom: 28px; }
    .dc-note-icon { color: var(--info); font-size: 20px; flex-shrink: 0; margin-top: 2px; }
    .dc-note strong { display: block; font-size: .875rem; color: var(--navy); margin-bottom: 4px; }
    .dc-note p { font-size: .85rem; color: var(--text-2); line-height: 1.6; }
    .dc-cta { display: flex; gap: 12px; flex-wrap: wrap; }
    p { font-size: .9rem; color: var(--text-2); line-height: 1.8; }
  `]
})
export class DeliveryConfirmationComponent {
  items = [
    { icon: 'notifications_active', title: 'Instant in-app notification',
      body: 'As soon as the driver marks the shipment Delivered, you receive a notification in your account and on the tracking page.' },
    { icon: 'schedule', title: 'Timestamped delivery time',
      body: 'The exact date and time the parcel was marked delivered is recorded and visible on the tracking page and in your shipment history.' },
    { icon: 'history', title: 'Permanent record in your dashboard',
      body: 'Every delivered shipment stays in your history with its tracking number, route, price and delivery time. You can look it up any time.' },
    { icon: 'gps_fixed', title: 'Last known driver position',
      body: 'The live map shows the driver position at the time of delivery, giving you a location reference for where the parcel was handed over.' },
  ];
}

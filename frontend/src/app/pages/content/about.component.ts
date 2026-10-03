import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  template: `
<app-page-layout title="About VAN DIRECT" subtitle="We make same-day parcel delivery accessible, transparent and reliable for every business and individual in the Ottawa region." eyebrow="Our story">
  <div class="ab-section">
    <h2 class="ab-h2">Our mission</h2>
    <p>VAN DIRECT was founded on a simple idea: parcel delivery should work the way a phone call does — fast, traceable, and always answered. We built a platform that connects senders directly with a network of vetted, independent drivers across the Ottawa–Gatineau region. Every booking generates a real-time GPS link so senders and recipients always know exactly where their parcel is.</p>
  </div>
  <div class="ab-values">
    <div *ngFor="let v of values" class="ab-val">
      <span class="material-icons ab-val-icon">{{ v.icon }}</span>
      <h3>{{ v.title }}</h3>
      <p>{{ v.body }}</p>
    </div>
  </div>
  <div class="ab-section">
    <h2 class="ab-h2">Join us</h2>
    <p>Whether you're a business looking for a reliable last-mile partner or a driver who wants flexible, well-paid work, there is a place for you at VAN DIRECT.</p>
    <div class="ab-cta-row">
      <a routerLink="/register" class="btn btn-primary">Create an account</a>
      <a routerLink="/careers"  class="btn btn-outline">See open roles</a>
    </div>
  </div>
</app-page-layout>`,
  styles: [`
    .ab-section { margin-bottom: 40px; }
    .ab-h2 { font-size: 1.2rem; font-weight: 700; color: var(--navy); margin-bottom: 12px; }
    p { font-size: .95rem; color: var(--text-2); line-height: 1.8; }
    .ab-values { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 20px; margin-bottom: 40px; }
    .ab-val { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; }
    .ab-val-icon { font-size: 28px; color: var(--brand); margin-bottom: 10px; display: block; }
    .ab-val h3 { font-size: .95rem; font-weight: 700; margin-bottom: 6px; }
    .ab-val p  { font-size: .85rem; }
    .ab-cta-row { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
  `]
})
export class AboutComponent {
  values = [
    { icon: 'bolt',          title: 'Speed',        body: 'Express deliveries dispatched within the hour. Standard deliveries same or next day.' },
    { icon: 'gps_fixed',     title: 'Transparency', body: 'Live GPS tracking from the moment a driver accepts the job to the final handoff.' },
    { icon: 'verified_user', title: 'Trust',         body: 'Every driver is vetted, licensed and rated. You always know who is carrying your parcel.' },
    { icon: 'eco',           title: 'Efficiency',   body: 'Smart route assignment reduces unnecessary kilometres and fuel consumption.' },
  ];
}

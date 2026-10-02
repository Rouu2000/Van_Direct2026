import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({ selector: 'app-how-it-works', standalone: true,
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  template: `
<app-page-layout title="How it works" subtitle="Book a parcel pickup in minutes. A vetted driver collects, tracks, and delivers it — you watch every step." eyebrow="Our process">
  <div class="hiw-steps">
    <div *ngFor="let s of steps; let i = index" class="hiw-step">
      <div class="hiw-num">{{ i + 1 }}</div>
      <div class="hiw-icon" [innerHTML]="s.svg"></div>
      <h2 class="hiw-title">{{ s.title }}</h2>
      <p class="hiw-body">{{ s.body }}</p>
    </div>
  </div>
  <div class="hiw-cta">
    <h3>Ready to ship?</h3>
    <p>Create your account in 30 seconds and book your first delivery today.</p>
    <a routerLink="/register" class="btn btn-primary">Get started</a>
  </div>
</app-page-layout>`,
  styles: [`
    .hiw-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; margin-bottom: 48px; }
    .hiw-step { text-align: center; padding: 28px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
    .hiw-num { width: 36px; height: 36px; border-radius: 50%; background: var(--brand); color: #fff; font-weight: 800; font-size: 1rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .hiw-icon { margin-bottom: 16px; }
    .hiw-icon svg { width: 48px; height: 48px; }
    .hiw-title { font-size: 1rem; font-weight: 700; color: var(--text); margin-bottom: 8px; }
    .hiw-body  { font-size: .875rem; color: var(--text-muted); line-height: 1.7; }
    .hiw-cta   { background: var(--navy); color: #fff; border-radius: var(--radius-xl); padding: 40px; text-align: center; }
    .hiw-cta h3 { font-size: 1.4rem; font-weight: 700; margin-bottom: 8px; }
    .hiw-cta p  { color: rgba(255,255,255,.7); margin-bottom: 20px; }
  `]
})
export class HowItWorksComponent {
  steps = [
    { title: 'Book a pickup', body: 'Enter pickup and drop-off addresses, add your parcels with weight and size, choose STANDARD or EXPRESS, and confirm. The whole process takes under two minutes.', svg: '<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="6" width="32" height="36" rx="4" fill="#EFF6FF" stroke="#2563EB" stroke-width="2"/><path d="M16 16h16M16 22h16M16 28h10" stroke="#2563EB" stroke-width="2" stroke-linecap="round"/></svg>' },
    { title: 'Driver assigned', body: 'Our system finds the nearest available, vetted driver. They receive the offer and have 30 seconds to accept. If they decline, the next nearest driver is offered the job automatically.', svg: '<svg viewBox="0 0 48 48" fill="none"><rect x="4" y="28" width="40" height="14" rx="4" fill="#FEF2F2" stroke="#C41E3A" stroke-width="2"/><path d="M4 30l8-14h16l8 14" stroke="#C41E3A" stroke-width="2"/><circle cx="14" cy="38" r="3" fill="#C41E3A"/><circle cx="34" cy="38" r="3" fill="#C41E3A"/></svg>' },
    { title: 'Driver collects', body: 'The driver arrives at your pickup address, scans the parcel, and marks it as picked up. You receive an instant notification with a live map showing their position.', svg: '<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="10" width="28" height="22" rx="4" fill="#ECFDF5" stroke="#16A34A" stroke-width="2"/><path d="M18 22l4 4 8-8" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    { title: 'Track live & receive', body: 'Watch the driver move on the map in real time. When the parcel reaches its destination and is handed over, you and the recipient both receive delivery confirmation.', svg: '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="20" r="10" fill="#FFF7ED" stroke="#D97706" stroke-width="2"/><circle cx="24" cy="20" r="4" fill="#D97706"/><path d="M24 30v12" stroke="#D97706" stroke-width="2" stroke-linecap="round"/></svg>' },
  ];
}

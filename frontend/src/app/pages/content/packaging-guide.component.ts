import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({ selector: 'app-packaging-guide', standalone: true,
  imports: [CommonModule, PageLayoutComponent],
  template: `
<app-page-layout title="Packaging guide" subtitle="Pack your parcels well and they'll arrive in perfect condition." eyebrow="Shipping">
  <div class="pg-grid">
    <div *ngFor="let s of sizes" class="pg-card">
      <div class="pg-badge" [style.background]="s.color + '18'" [style.color]="s.color">{{ s.label }}</div>
      <h3 class="pg-title">{{ s.name }}</h3>
      <p class="pg-dims">{{ s.dims }}</p>
      <ul class="pg-tips">
        <li *ngFor="let t of s.tips">{{ t }}</li>
      </ul>
    </div>
  </div>
  <div class="pg-rules">
    <h2 class="pg-rules-title">General rules</h2>
    <ul class="pg-rules-list">
      <li *ngFor="let r of rules">{{ r }}</li>
    </ul>
  </div>
</app-page-layout>`,
  styles: [`
    .pg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 20px; margin-bottom: 40px; }
    .pg-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; }
    .pg-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-pill); font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 10px; }
    .pg-title { font-size: 1rem; font-weight: 700; margin-bottom: 4px; }
    .pg-dims  { font-size: .8rem; color: var(--text-muted); margin-bottom: 12px; }
    .pg-tips  { padding-left: 16px; display: flex; flex-direction: column; gap: 6px; }
    .pg-tips li { font-size: .875rem; color: var(--text-2); line-height: 1.5; }
    .pg-rules { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px; }
    .pg-rules-title { font-size: 1rem; font-weight: 700; margin-bottom: 16px; }
    .pg-rules-list { padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
    .pg-rules-list li { font-size: .875rem; color: var(--text-2); line-height: 1.6; }
  `]
})
export class PackagingGuideComponent {
  sizes = [
    { label: 'SMALL', name: 'Small parcel', dims: 'Up to 30 × 20 × 15 cm, max 5 kg', color: '#2563EB',
      tips: ['Use a sturdy cardboard box', 'Wrap fragile items in bubble wrap', 'Fill empty space with paper or foam', 'Seal all seams with packing tape'] },
    { label: 'MEDIUM', name: 'Medium parcel', dims: 'Up to 50 × 40 × 30 cm, max 15 kg', color: '#D97706',
      tips: ['Double-box very fragile items', 'Label clearly with recipient name and phone', 'Keep weight evenly distributed', 'Mark fragile or this-way-up if needed'] },
    { label: 'LARGE', name: 'Large parcel', dims: 'Up to 80 × 60 × 50 cm, max 30 kg', color: '#C41E3A',
      tips: ['Reinforce corners and edges with extra tape', 'Attach address labels on at least two sides', 'Do not overfill — box must close flat', 'Consider insurance for high-value items'] },
  ];
  rules = [
    'Do not ship prohibited items: flammable liquids, explosives, live animals, illegal goods.',
    'Declare the correct weight — you may be charged for the difference if it is under-declared.',
    'Seal your parcel completely before the driver arrives.',
    'Keep proof of packaging in case of a damage claim.',
    'VAN DIRECT does not accept parcels over 30 kg or longer than 120 cm on any side.',
  ];
}

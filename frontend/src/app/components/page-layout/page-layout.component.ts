import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pl-hero" [style.background]="heroBg">
      <div class="pl-hero-inner">
        <p *ngIf="eyebrow" class="pl-eyebrow">{{ eyebrow }}</p>
        <h1 class="pl-title">{{ title }}</h1>
        <p *ngIf="subtitle" class="pl-subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <main id="main-content" class="pl-content">
      <ng-content></ng-content>
    </main>
  `,
  styles: [`
    .pl-hero {
      background: linear-gradient(135deg, #1B3A6B 0%, #0F2548 100%);
      padding: 56px 24px 48px;
    }
    .pl-hero-inner { max-width: 860px; margin: 0 auto; }
    .pl-eyebrow {
      font-size: .75rem; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; color: rgba(255,255,255,.55); margin-bottom: 10px;
    }
    .pl-title {
      font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 800;
      color: #fff; margin-bottom: 10px; line-height: 1.2;
    }
    .pl-subtitle { font-size: 1rem; color: rgba(255,255,255,.7); max-width: 540px; line-height: 1.6; }
    .pl-content { max-width: 900px; margin: 0 auto; padding: 48px 24px 80px; }
    @media (max-width: 640px) { .pl-hero { padding: 40px 16px 32px; } .pl-content { padding: 32px 16px 60px; } }
  `]
})
export class PageLayoutComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() eyebrow = '';
  @Input() heroBg = '';
}

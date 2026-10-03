import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-drive-band',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<section class="db-band" aria-labelledby="db-heading">
  <div class="db-overlay" aria-hidden="true"></div>
  <img src="images/warehouse.jpg" alt="" aria-hidden="true" width="1440" height="480"
       class="db-bg" loading="lazy" decoding="async">
  <div class="db-inner">
    <div class="db-content">
      <h2 id="db-heading" class="db-title">Drive with VAN DIRECT</h2>
      <p class="db-sub">Join our fleet of independent drivers across the Ottawa�Gatineau region. Set your own hours and earn on every delivery.</p>
      <div class="db-benefits">
        <div *ngFor="let b of benefits" class="db-benefit">
          <span class="db-benefit-icon" [innerHTML]="b.svg" aria-hidden="true"></span>
          <span>{{ b.text }}</span>
        </div>
      </div>
      <a routerLink="/register" class="db-btn">Become a driver →</a>
    </div>
  </div>
</section>`,
  styles: [`
    .db-band { position: relative; min-height: 400px; display: flex; align-items: center; overflow: hidden; }
    .db-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
    .db-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(196,30,58,.9) 0%, rgba(15,31,61,.9) 100%); z-index: 1; }
    .db-inner { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 64px 24px; width: 100%; }
    .db-content { max-width: 600px; }
    .db-title { font-size: clamp(1.6rem,3.5vw,2.4rem); font-weight: 800; color: #fff; margin-bottom: 12px; line-height: 1.2; }
    .db-sub   { font-size: 1rem; color: rgba(255,255,255,.8); line-height: 1.7; margin-bottom: 28px; }
    .db-benefits { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
    .db-benefit { display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,.9); font-size: .9rem; font-weight: 500; }
    .db-benefit-icon { flex-shrink: 0; opacity: .85; }
    .db-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px; background: #fff; color: var(--navy);
      border-radius: var(--radius-sm); font-weight: 700; font-size: .95rem;
      text-decoration: none; transition: all 150ms;
    }
    .db-btn:hover { background: var(--surface-2); color: var(--brand); }
    @media (max-width: 640px) { .db-inner { padding: 48px 20px; } }
  `]
})
export class DriveBandComponent {
  benefits = [
    { text: 'Flexible hours — work when you want',
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 15H11v-6h1.5v6zm0-8H11V7h1.5v2z"/></svg>` },
    { text: 'Weekly payout directly to your account',
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>` },
    { text: 'Simple app — accept, navigate, deliver',
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M17 1.01L7 1a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-1.99zM17 19H7V5h10v14z"/></svg>` },
  ];
}

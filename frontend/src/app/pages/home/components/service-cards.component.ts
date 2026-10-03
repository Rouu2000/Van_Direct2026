import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-service-cards',
  standalone: true,
  imports: [RouterLink],
  template: `
<section class="sc-section">
  <div class="sc-inner">
    <div class="sc-heading">
      <h2>Choose your service</h2>
      <p>Both tiers include live GPS tracking, in-app notifications and vetted drivers.</p>
    </div>
    <div class="sc-cards">
      <div class="sc-card">
        <div class="sc-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm.5 15H11v-6h1.5v6zm0-8H11V7h1.5v2z"/>
          </svg>
        </div>
        <h3 class="sc-tier">STANDARD</h3>
        <p class="sc-desc">Reliable everyday delivery â$” perfect for parcels that need to arrive safely without urgency.</p>
        <ul class="sc-benefits">
          <li>Same-day or next-day delivery</li>
          <li>Nearest available driver assigned</li>
          <li>Full live tracking included</li>
        </ul>
        <a routerLink="/register" class="sc-btn sc-btn-outline">Choose Standard</a>
      </div>
      <div class="sc-card sc-card-featured">
        <div class="sc-fastest">Fastest</div>
        <div class="sc-icon sc-icon-brand">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="m13 3-4 8h3v10l8-12h-5z"/>
            <path d="M4 17h2v4h2v-4h2l-3-5-3 5z" opacity=".4"/>
          </svg>
        </div>
        <h3 class="sc-tier">EXPRESS</h3>
        <p class="sc-desc">Priority pickup dispatched immediately. The closest available driver is offered your shipment first.</p>
        <ul class="sc-benefits">
          <li>Priority driver assignment</li>
          <li>Fastest available route</li>
          <li>Real-time GPS every 5 seconds</li>
        </ul>
        <a routerLink="/register" class="sc-btn sc-btn-primary">Choose Express</a>
      </div>
    </div>
  </div>
</section>`,
  styles: [`
    .sc-section { background: var(--surface-2); padding: 80px 24px; }
    .sc-inner   { max-width: 1200px; margin: 0 auto; }
    .sc-heading { text-align: center; margin-bottom: 48px; }
    .sc-heading h2 { font-size: clamp(1.5rem,3vw,2rem); font-weight: 800; color: var(--navy); margin-bottom: 10px; }
    .sc-heading p  { color: var(--text-muted); font-size: .95rem; }
    .sc-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 820px; margin: 0 auto; }
    .sc-card {
      background: var(--surface); border: 2px solid var(--border);
      border-radius: var(--radius-xl); padding: 36px 32px;
      display: flex; flex-direction: column; gap: 16px; position: relative;
      transition: box-shadow 200ms;
    }
    .sc-card:hover { box-shadow: var(--shadow-lg); }
    .sc-card-featured { border-color: var(--brand); box-shadow: 0 4px 24px rgba(196,30,58,.12); }
    .sc-fastest {
      position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
      background: var(--brand); color: #fff; font-size: .72rem; font-weight: 700;
      padding: 4px 14px; border-radius: var(--radius-pill); letter-spacing: .5px;
      text-transform: uppercase; white-space: nowrap;
    }
    .sc-icon { width: 60px; height: 60px; background: var(--surface-2); border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center; color: var(--navy); }
    .sc-icon-brand { background: rgba(196,30,58,.08); color: var(--brand); }
    .sc-tier { font-size: 1.3rem; font-weight: 800; color: var(--navy); }
    .sc-desc { font-size: .875rem; color: var(--text-2); line-height: 1.7; flex: 1; }
    .sc-benefits { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .sc-benefits li { font-size: .875rem; color: var(--text-2); display: flex; align-items: center; gap: 8px; }
    .sc-benefits li::before { content: 'âœ“'; color: var(--success); font-weight: 700; flex-shrink: 0; }
    .sc-btn { display: block; text-align: center; padding: 13px; border-radius: var(--radius-sm); font-weight: 700; font-size: .9rem; text-decoration: none; transition: all 150ms; }
    .sc-btn-outline { border: 2px solid var(--navy); color: var(--navy); }
    .sc-btn-outline:hover { background: var(--navy); color: #fff; }
    .sc-btn-primary { background: var(--brand); color: #fff; border: 2px solid var(--brand); }
    .sc-btn-primary:hover { background: var(--brand-hover); border-color: var(--brand-hover); color: #fff; }
    @media (max-width: 640px) { .sc-cards { grid-template-columns: 1fr; } }
  `]
})
export class ServiceCardsComponent {}

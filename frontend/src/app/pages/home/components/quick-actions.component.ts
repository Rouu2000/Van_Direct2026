import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<section class="qa-section" aria-label="Quick actions">
  <div class="qa-inner">
    <a *ngFor="let a of actions" [routerLink]="a.route" class="qa-tile">
      <span class="qa-icon" [innerHTML]="a.svg" aria-hidden="true"></span>
      <span class="qa-label">{{ a.label }}</span>
    </a>
  </div>
</section>`,
  styles: [`
    .qa-section { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
    .qa-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px;
      display: grid; grid-template-columns: repeat(6, 1fr); }
    .qa-tile {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 28px 12px; text-decoration: none; color: var(--text-2);
      font-size: .8rem; font-weight: 600; text-align: center;
      border-right: 1px solid var(--border); transition: background 150ms, color 150ms;
    }
    .qa-tile:last-child { border-right: none; }
    .qa-tile:hover { background: var(--bg-2); color: var(--brand); }
    .qa-tile:focus-visible { outline: 2px solid var(--brand); outline-offset: -2px; }
    .qa-icon { transition: transform 150ms; }
    .qa-tile:hover .qa-icon { transform: translateY(-3px); }
    @media (max-width: 900px) { .qa-inner { grid-template-columns: repeat(3, 1fr); }
      .qa-tile { border-right: none; border-bottom: 1px solid var(--border); }
    }
    @media (max-width: 480px) { .qa-inner { grid-template-columns: repeat(2, 1fr); }
      .qa-tile:nth-child(odd) { border-right: 1px solid var(--border); }
    }
  `]
})
export class QuickActionsComponent {
  actions = [
    { label: 'Track a parcel',    route: '/track',
      svg: `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>` },
    { label: 'Schedule a pickup',  route: '/customer/shipments/new',
      svg: `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>` },
    { label: 'Price estimate',     route: '/price-estimate',
      svg: `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>` },
    { label: 'Packaging guide',    route: '/packaging-guide',
      svg: `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.53 15.47 0 12.36 0c-1.73 0-3.24.8-4.23 2.05L6 4 4.77 2.05C3.78.8 2.27 0 .55 0h-.11v2h.11c.95 0 1.8.45 2.36 1.13L4.5 5H2v2h20v-1h-2.18zM4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9H4z"/></svg>` },
    { label: 'Drop-off points',    route: '/drop-off-points',
      svg: `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>` },
    { label: 'Contact support',    route: '/contact',
      svg: `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>` },
  ];
}

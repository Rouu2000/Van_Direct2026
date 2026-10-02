import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

/** Shared "Coming soon" page — used for Returns and SMS updates */
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  template: `
<app-page-layout [title]="title" [subtitle]="subtitle" eyebrow="Coming soon">
  <div class="cs-badge">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 15H11v-6h1.5v6zm0-8H11V7h1.5v2z"/>
    </svg>
    Coming soon
  </div>
  <p class="cs-body">{{ description }}</p>
  <p class="cs-body" style="margin-top:12px">In the meantime, you can track your parcel and get in-app notifications at every status change.</p>
  <div class="cs-cta">
    <a routerLink="/in-app-notifications" class="btn btn-primary">In-app notifications →</a>
    <a routerLink="/contact" class="btn btn-outline">Contact us</a>
  </div>
</app-page-layout>`,
  styles: [`
    .cs-badge { display: inline-flex; align-items: center; gap: 7px; background: var(--warning-bg); color: var(--warning); font-size: .8rem; font-weight: 700; padding: 6px 14px; border-radius: var(--radius-pill); margin-bottom: 20px; text-transform: uppercase; letter-spacing: .5px; }
    .cs-body { font-size: .95rem; color: var(--text-2); line-height: 1.8; }
    .cs-cta  { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
  `]
})
export class ComingSoonComponent {
  @Input() title = 'Coming soon';
  @Input() subtitle = '';
  @Input() description = '';
}

// ── Returns ──────────────────────────────────────────────────
@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon
    title="Returns"
    subtitle="We are working on a convenient return-shipment service for VAN DIRECT customers."
    description="Returns — booking a reverse shipment from the original recipient back to the sender — are not yet available. We expect to launch this feature in an upcoming release. Register your interest by contacting our support team.">
  </app-coming-soon>`
})
export class ReturnsComponent {}

// ── SMS updates ──────────────────────────────────────────────
@Component({
  selector: 'app-sms-updates',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon
    title="SMS updates"
    subtitle="Text-message status alerts are on our roadmap — in-app notifications are available now."
    description="SMS notifications — receiving a text message at every shipment status change — are not yet implemented. All notifications currently arrive through the VAN DIRECT app. SMS alerts will be added in a future release at no extra cost.">
  </app-coming-soon>`
})
export class SmsUpdatesComponent {}

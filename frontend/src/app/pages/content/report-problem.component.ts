import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({ selector: 'app-report-problem', standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  template: `
<app-page-layout title="Report a problem" subtitle="Missing parcel, damage, or a late delivery? Let us know and we'll investigate within 24 hours." eyebrow="Support">
  <form class="rp-form" (ngSubmit)="submit()" *ngIf="!sent()">
    <div class="form-group"><label>Tracking number</label><input class="form-control" [(ngModel)]="f.tracking" name="tracking" placeholder="TRK-XXXXXX" required></div>
    <div class="form-group">
      <label>Problem type</label>
      <select class="form-control" [(ngModel)]="f.type" name="type" required>
        <option value="">Select…</option>
        <option>Parcel not delivered</option>
        <option>Parcel arrived damaged</option>
        <option>Wrong item delivered</option>
        <option>Late delivery</option>
        <option>Driver behaviour</option>
        <option>Other</option>
      </select>
    </div>
    <div class="form-group"><label>Your email</label><input class="form-control" type="email" [(ngModel)]="f.email" name="email" required></div>
    <div class="form-group"><label>Describe what happened</label><textarea class="form-control" rows="5" [(ngModel)]="f.desc" name="desc" required></textarea></div>
    <button class="btn btn-primary" type="submit">Submit report</button>
    <p class="rp-note">⚠ Front-end only — no data is sent yet.</p>
  </form>
  <div class="rp-thanks" *ngIf="sent()">
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="28" fill="#ECFDF5"/><path d="M18 28l8 8 14-16" stroke="#16A34A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <h2>Report submitted</h2>
    <p>We'll investigate and respond to your email within 24 hours.</p>
  </div>
</app-page-layout>`,
  styles: [`
    .rp-form { max-width: 560px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px; }
    .rp-note { font-size: .75rem; color: var(--text-muted); margin-top: 8px; }
    .rp-thanks { text-align: center; padding: 48px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .rp-thanks h2 { font-size: 1.2rem; font-weight: 700; }
    .rp-thanks p  { color: var(--text-muted); }
  `]
})
export class ReportProblemComponent {
  sent = signal(false);
  f = { tracking: '', type: '', email: '', desc: '' };
  submit() { if (this.f.tracking && this.f.email && this.f.desc) this.sent.set(true); }
}

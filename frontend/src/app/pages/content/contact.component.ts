import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';

@Component({ selector: 'app-contact', standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  template: `
<app-page-layout title="Contact us" subtitle="We're available Monday to Saturday, 8 am – 8 pm." eyebrow="Support">
  <div class="ct-grid">
    <div class="ct-info">
      <div class="ct-card">
        <span class="material-icons ct-icon">phone</span>
        <div><strong>Phone</strong><br><span class="ct-detail">TODO: +216 XX XXX XXX</span></div>
      </div>
      <div class="ct-card">
        <span class="material-icons ct-icon">email</span>
        <div><strong>Email</strong><br><span class="ct-detail">TODO: support&#64;vandirect.tn</span></div>
      </div>
      <div class="ct-card">
        <span class="material-icons ct-icon">location_on</span>
        <div><strong>Head office</strong><br><span class="ct-detail">TODO: Address, Tunis, Tunisia</span></div>
      </div>
      <p class="ct-placeholder-note">⚠ Contact details are placeholders — replace before go-live.</p>
    </div>
    <form class="ct-form" (ngSubmit)="send()" *ngIf="!sent()">
      <h2 class="ct-form-title">Send a message</h2>
      <div class="form-group"><label>Full name</label><input class="form-control" [(ngModel)]="f.name" name="name" required></div>
      <div class="form-group"><label>Email address</label><input class="form-control" type="email" [(ngModel)]="f.email" name="email" required></div>
      <div class="form-group"><label>Subject</label><input class="form-control" [(ngModel)]="f.subject" name="subject"></div>
      <div class="form-group"><label>Message</label><textarea class="form-control" rows="5" [(ngModel)]="f.message" name="message" required></textarea></div>
      <button class="btn btn-primary" type="submit">Send message</button>
      <p class="ct-note">⚠ Front-end only — no email is sent yet.</p>
    </form>
    <div class="ct-thanks" *ngIf="sent()">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="28" fill="#ECFDF5"/><path d="M18 28l8 8 14-16" stroke="#16A34A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <h2>Message received</h2>
      <p>Thank you! We'll get back to you within one business day.</p>
    </div>
  </div>
</app-page-layout>`,
  styles: [`
    .ct-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 40px; }
    @media (max-width: 640px) { .ct-grid { grid-template-columns: 1fr; } }
    .ct-info { display: flex; flex-direction: column; gap: 16px; }
    .ct-card { display: flex; align-items: flex-start; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
    .ct-icon { color: var(--brand); font-size: 22px; flex-shrink: 0; margin-top: 2px; }
    .ct-detail { font-size: .875rem; color: var(--text-muted); }
    .ct-placeholder-note { font-size: .75rem; color: var(--warning); background: var(--warning-bg); padding: 8px 12px; border-radius: var(--radius-sm); }
    .ct-form { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px; }
    .ct-form-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 20px; }
    .ct-note { font-size: .75rem; color: var(--text-muted); margin-top: 8px; }
    .ct-thanks { text-align: center; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .ct-thanks h2 { font-size: 1.2rem; font-weight: 700; }
    .ct-thanks p  { color: var(--text-muted); }
  `]
})
export class ContactComponent {
  sent = signal(false);
  f = { name: '', email: '', subject: '', message: '' };
  send() { if (this.f.name && this.f.email && this.f.message) this.sent.set(true); }
}

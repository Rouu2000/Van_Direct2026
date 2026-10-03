import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';
import { emailValidator, nameValidator, getError, focusFirstInvalid } from '../../shared/validators';

@Component({ selector: 'app-contact', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageLayoutComponent],
  template: `
<app-page-layout title="Contact us" subtitle="We're available Monday to Saturday, 8 am – 8 pm (Eastern Time)." eyebrow="Support">
  <div class="ct-grid">
    <div class="ct-info">
      <div class="ct-card">
        <span class="material-icons ct-icon">phone</span>
        <div><strong>Phone</strong><br><span class="ct-detail">TODO: +1 (613) 555-0100</span></div>
      </div>
      <div class="ct-card">
        <span class="material-icons ct-icon">email</span>
        <div><strong>Email</strong><br><span class="ct-detail">TODO: support&#64;vandirect.ca</span></div>
      </div>
      <div class="ct-card">
        <span class="material-icons ct-icon">location_on</span>
        <div><strong>Head office</strong><br><span class="ct-detail">TODO: 123 Example Street, Ottawa, ON K1A 0B1</span></div>
      </div>
      <p class="ct-placeholder-note">⚠ Contact details are placeholders — replace before go-live.</p>
    </div>

    <ng-container *ngIf="!sent()">
      <form #formEl [formGroup]="form" (ngSubmit)="send()" class="ct-form" novalidate>
        <h2 class="ct-form-title">Send a message</h2>

        <div class="vf-field">
          <label class="vf-label" for="ct-name">Full name <span class="vf-req">*</span></label>
          <input id="ct-name" class="vf-input" formControlName="name"
                 [attr.aria-invalid]="showErr('name')" aria-describedby="ct-name-err">
          <span id="ct-name-err" class="vf-error" *ngIf="showErr('name')">{{ getError(form.get('name')) }}</span>
        </div>

        <div class="vf-field">
          <label class="vf-label" for="ct-email">Email <span class="vf-req">*</span></label>
          <input id="ct-email" class="vf-input" type="email" formControlName="email"
                 [attr.aria-invalid]="showErr('email')" aria-describedby="ct-email-err">
          <span id="ct-email-err" class="vf-error" *ngIf="showErr('email')">{{ getError(form.get('email')) }}</span>
        </div>

        <div class="vf-field">
          <label class="vf-label" for="ct-subject">Subject</label>
          <input id="ct-subject" class="vf-input" formControlName="subject">
        </div>

        <div class="vf-field">
          <label class="vf-label" for="ct-msg">Message <span class="vf-req">*</span></label>
          <textarea id="ct-msg" class="vf-input" rows="5" formControlName="message"
                    [attr.aria-invalid]="showErr('message')" aria-describedby="ct-msg-err"></textarea>
          <span id="ct-msg-err" class="vf-error" *ngIf="showErr('message')">{{ getError(form.get('message')) }}</span>
          <span class="vf-hint">{{ form.get('message')?.value?.length || 0 }} / 1000</span>
        </div>

        <button class="btn btn-primary" type="submit" [disabled]="submitting">
          {{ submitting ? 'Sending…' : 'Send message' }}
        </button>
        <p class="ct-note">⚠ Front-end only — no email is sent yet.</p>
      </form>
    </ng-container>

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
export class ContactComponent implements OnInit {
  @ViewChild('formEl') formEl!: ElementRef<HTMLFormElement>;
  form!: FormGroup;
  sent = signal(false);
  submitting = false;
  getError = getError;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name:    ['', [Validators.required, nameValidator()]],
      email:   ['', [Validators.required, emailValidator()]],
      subject: [''],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  showErr(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  send(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) { focusFirstInvalid(this.formEl?.nativeElement); return; }
    this.submitting = true;
    setTimeout(() => { this.submitting = false; this.sent.set(true); }, 400);
  }
}

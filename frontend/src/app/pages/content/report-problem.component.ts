import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageLayoutComponent } from '../../components/page-layout/page-layout.component';
import { emailValidator, trackingNumberValidator, getError, focusFirstInvalid } from '../../shared/validators';

@Component({ selector: 'app-report-problem', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageLayoutComponent],
  template: `
<app-page-layout title="Report a problem" subtitle="Missing parcel, damage, or a late delivery? Let us know and we'll investigate within 24 hours." eyebrow="Support">
  <form #formEl [formGroup]="form" (ngSubmit)="submit()" class="rp-form" novalidate *ngIf="!sent()">

    <div class="vf-field">
      <label class="vf-label" for="rp-tn">Tracking number <span class="vf-hint">(optional)</span></label>
      <input id="rp-tn" class="vf-input" formControlName="tracking" placeholder="TRK-123456"
             [attr.aria-invalid]="showErr('tracking')" aria-describedby="rp-tn-err">
      <span id="rp-tn-err" class="vf-error" *ngIf="showErr('tracking')">{{ getError(form.get('tracking')) }}</span>
    </div>

    <div class="vf-field">
      <label class="vf-label" for="rp-type">Problem type <span class="vf-req">*</span></label>
      <select id="rp-type" class="vf-input" formControlName="type"
              [attr.aria-invalid]="showErr('type')" aria-describedby="rp-type-err">
        <option value="">Select…</option>
        <option>Parcel not delivered</option>
        <option>Parcel arrived damaged</option>
        <option>Wrong item delivered</option>
        <option>Late delivery</option>
        <option>Driver behaviour</option>
        <option>Other</option>
      </select>
      <span id="rp-type-err" class="vf-error" *ngIf="showErr('type')">{{ getError(form.get('type')) }}</span>
    </div>

    <div class="vf-field">
      <label class="vf-label" for="rp-email">Your email <span class="vf-req">*</span></label>
      <input id="rp-email" class="vf-input" type="email" formControlName="email"
             [attr.aria-invalid]="showErr('email')" aria-describedby="rp-email-err">
      <span id="rp-email-err" class="vf-error" *ngIf="showErr('email')">{{ getError(form.get('email')) }}</span>
    </div>

    <div class="vf-field">
      <label class="vf-label" for="rp-desc">What happened <span class="vf-req">*</span></label>
      <textarea id="rp-desc" class="vf-input" rows="5" formControlName="desc"
                [attr.aria-invalid]="showErr('desc')" aria-describedby="rp-desc-err"></textarea>
      <span id="rp-desc-err" class="vf-error" *ngIf="showErr('desc')">{{ getError(form.get('desc')) }}</span>
      <span class="vf-hint">{{ form.get('desc')?.value?.length || 0 }} / 1000</span>
    </div>

    <button class="btn btn-primary" type="submit" [disabled]="submitting">
      {{ submitting ? 'Submitting…' : 'Submit report' }}
    </button>
    <p class="rp-note">⚠ Front-end only — no data is sent yet.</p>
  </form>

  <div class="rp-thanks" *ngIf="sent()">
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="28" fill="#ECFDF5"/><path d="M18 28l8 8 14-16" stroke="#16A34A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <h2>Report submitted</h2>
    <p>We'll investigate and respond within 24 hours.</p>
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
export class ReportProblemComponent implements OnInit {
  @ViewChild('formEl') formEl!: ElementRef<HTMLFormElement>;
  form!: FormGroup;
  sent = signal(false);
  submitting = false;
  getError = getError;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      tracking: ['', [trackingNumberValidator()]],   // optional but format-validated if filled
      type:     ['', Validators.required],
      email:    ['', [Validators.required, emailValidator()]],
      desc:     ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  showErr(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) { focusFirstInvalid(this.formEl?.nativeElement); return; }
    this.submitting = true;
    setTimeout(() => { this.submitting = false; this.sent.set(true); }, 400);
  }
}

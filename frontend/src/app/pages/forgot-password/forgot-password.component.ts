import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { BrandLogoComponent } from '../../components/brand-logo/brand-logo.component';
import { AuthService } from '../../services/auth.service';
import { emailValidator, getError, focusFirstInvalid } from '../../shared/validators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatButtonModule, BrandLogoComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnInit {
  @ViewChild('formEl') formEl!: ElementRef<HTMLFormElement>;
  form!: FormGroup;
  serverError = ''; successMessage = ''; submitting = false;
  getError = getError;

  constructor(private fb: FormBuilder, private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.form = this.fb.group({ email: ['', [Validators.required, emailValidator()]] });
  }

  get email() { return this.form.get('email')!; }
  showErr(c: ReturnType<FormGroup['get']>): boolean { return !!c && c.invalid && (c.touched || c.dirty); }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) { focusFirstInvalid(this.formEl?.nativeElement); return; }
    this.serverError = ''; this.submitting = true; this.cdr.markForCheck();
    this.authService.requestPasswordReset(this.email.value.trim()).subscribe({
      next: (res: any) => { this.submitting = false; this.successMessage = res?.message || 'Reset link sent if the account exists.'; this.cdr.markForCheck(); },
      error: (err: any) => { this.submitting = false; this.serverError = err.error?.message || 'Request failed.'; this.cdr.markForCheck(); }
    });
  }
}

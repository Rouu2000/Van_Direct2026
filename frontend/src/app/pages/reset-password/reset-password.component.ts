import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { BrandLogoComponent } from '../../components/brand-logo/brand-logo.component';
import { AuthService } from '../../services/auth.service';
import { passwordStrengthValidator, passwordsMatchValidator, getError, focusFirstInvalid } from '../../shared/validators';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatButtonModule, BrandLogoComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  @ViewChild('formEl') formEl!: ElementRef<HTMLFormElement>;
  form!: FormGroup;
  token = ''; hidePassword = true; submitting = false;
  serverError = ''; successMessage = '';
  getError = getError;

  constructor(
    private fb: FormBuilder, private route: ActivatedRoute,
    private router: Router, private authService: AuthService, private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.form = this.fb.group({
      newPassword:     ['', [Validators.required, passwordStrengthValidator()]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordsMatchValidator('newPassword', 'confirmPassword') });
  }

  get newPassword()     { return this.form.get('newPassword')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }
  showErr(c: ReturnType<FormGroup['get']>): boolean { return !!c && c.invalid && (c.touched || c.dirty); }
  showMismatch(): boolean { return !!this.form.errors?.['passwordsMismatch'] && (this.confirmPassword.touched || this.confirmPassword.dirty); }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) { focusFirstInvalid(this.formEl?.nativeElement); return; }
    if (!this.token) { this.serverError = 'Reset token is missing. Please use the link from your email.'; return; }
    this.serverError = ''; this.submitting = true; this.cdr.markForCheck();
    this.authService.confirmPasswordReset({ token: this.token, newPassword: this.newPassword.value }).subscribe({
      next: (res: any) => { this.submitting = false; this.successMessage = res?.message || 'Password reset successfully.'; this.cdr.markForCheck(); },
      error: (err: any) => { this.submitting = false; this.serverError = err.error?.message || 'Reset failed — link may be expired.'; this.cdr.markForCheck(); }
    });
  }
}

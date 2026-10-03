import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { BrandLogoComponent } from '../../components/brand-logo/brand-logo.component';
import { AuthService } from '../../services/auth.service';
import {
  emailValidator, phoneValidator, passwordStrengthValidator, nameValidator,
  licenceValidator, passwordsMatchValidator, getError, focusFirstInvalid
} from '../../shared/validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule,
            MatButtonModule, MatButtonToggleModule, BrandLogoComponent],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent implements OnInit {
  @ViewChild('formEl') formEl!: ElementRef<HTMLFormElement>;

  isDriverMode    = false;
  showPendingMessage = false;
  hidePassword    = true;
  submitting      = false;
  serverError     = '';
  successMessage  = '';
  fieldErrors: Record<string, string> = {};
  form!: FormGroup;
  getError = getError;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.buildForm(); }

  private buildForm(): void {
    this.form = this.fb.group({
      name:            ['', [Validators.required, nameValidator()]],
      email:           ['', [Validators.required, emailValidator()]],
      passwordHash:    ['', [Validators.required, passwordStrengthValidator()]],
      confirmPassword: ['', [Validators.required]],
      phone:           ['', [phoneValidator()]],
      // driver-only
      vehicleType:     [''],
      licenseNumber:   ['']
    }, { validators: passwordsMatchValidator('passwordHash', 'confirmPassword') });
  }

  get name()            { return this.form.get('name')!; }
  get email()           { return this.form.get('email')!; }
  get passwordHash()    { return this.form.get('passwordHash')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }
  get phone()           { return this.form.get('phone')!; }
  get vehicleType()     { return this.form.get('vehicleType')!; }
  get licenseNumber()   { return this.form.get('licenseNumber')!; }

  showErr(ctrl: ReturnType<FormGroup['get']>): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }
  showGroupErr(key: string): boolean {
    return !!this.form.errors?.[key] && (this.confirmPassword.touched || this.confirmPassword.dirty);
  }

  toggleMode(mode: string): void {
    this.isDriverMode = mode === 'driver';
    if (this.isDriverMode) {
      this.vehicleType.setValidators([Validators.required]);
      this.licenseNumber.setValidators([Validators.required, licenceValidator()]);
    } else {
      this.vehicleType.clearValidators();
      this.licenseNumber.clearValidators();
    }
    this.vehicleType.updateValueAndValidity();
    this.licenseNumber.updateValueAndValidity();
    this.serverError = ''; this.fieldErrors = {};
    this.cdr.markForCheck();
  }

  serverFieldError(field: string): string { return this.fieldErrors[field] || ''; }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) { focusFirstInvalid(this.formEl?.nativeElement); return; }

    this.serverError = ''; this.fieldErrors = {}; this.submitting = true;
    this.cdr.markForCheck();

    const v = this.form.value;
    const payload = { name: v.name.trim(), email: v.email.trim(), passwordHash: v.passwordHash,
                      phone: v.phone?.trim() || '', vehicleType: v.vehicleType, licenseNumber: v.licenseNumber };

    const obs = this.isDriverMode
      ? this.authService.registerDriver(payload)
      : this.authService.register(payload);

    obs.subscribe({
      next: (res) => {
        this.submitting = false;
        if (this.isDriverMode) {
          this.showPendingMessage = true;
        } else {
          this.router.navigate(['/customer/dashboard']);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting  = false;
        this.serverError = err.error?.message || 'Registration failed.';
        this.fieldErrors = err.error?.fieldErrors || {};
        this.cdr.markForCheck();
      }
    });
  }
}

import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { BrandLogoComponent } from '../../components/brand-logo/brand-logo.component';
import { AuthService } from '../../services/auth.service';
import { emailValidator, getError, focusFirstInvalid } from '../../shared/validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatButtonModule, BrandLogoComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  @ViewChild('formEl') formEl!: ElementRef<HTMLFormElement>;

  form!: FormGroup;
  serverError   = '';
  sessionBanner = '';   // set when redirected here after a 401
  submitting    = false;
  hidePassword  = true;
  getError      = getError;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email:    ['', [Validators.required, emailValidator()]],
      password: ['', [Validators.required]]
    });

    // Show banner when redirected here after a 401
    this.route.queryParams.subscribe(params => {
      if (params['reason'] === 'session_expired') {
        this.sessionBanner = 'Your session expired. Please sign in again.';
        this.cdr.markForCheck();
      }
    });
  }

  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  showErr(ctrl: ReturnType<FormGroup['get']>): boolean {
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) { focusFirstInvalid(this.formEl?.nativeElement); return; }
    this.serverError = '';
    this.submitting  = true;
    this.cdr.markForCheck();

    this.authService.login({ email: this.email.value.trim(), password: this.password.value }).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res?.token) {
          const role = this.authService.getUserRole() || res.user?.role;
          if (role === 'ADMIN')    this.router.navigate(['/admin/dashboard']);
          else if (role === 'DRIVER')   this.router.navigate(['/driver/deliveries']);
          else this.router.navigate(['/customer/dashboard']);
        }
      },
      error: (err) => {
        this.submitting  = false;
        this.serverError = err.error?.message || 'Invalid email or password.';
        this.cdr.markForCheck();
      }
    });
  }
}

import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatButtonToggleModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  isDriverMode: boolean = false;
  showPendingMessage: boolean = false;
  hidePassword = true;
  submitting = false;

  user = {
    name: '',
    email: '',
    passwordHash: '',
    phone: '',
    role: 'CUSTOMER',
    vehicleType: '',
    licenseNumber: ''
  };

  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  toggleMode(mode: string): void {
    this.isDriverMode = mode === 'driver';
    this.user.role = this.isDriverMode ? 'DRIVER' : 'CUSTOMER';
    this.errorMessage = '';
    this.successMessage = '';
    this.showPendingMessage = false;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.showPendingMessage = false;
    this.submitting = true;
    this.cdr.markForCheck();

    if (this.isDriverMode) {
      this.user.role = 'DRIVER';
      this.authService.registerDriver(this.user).subscribe({
        next: () => {
          this.submitting = false;
          this.showPendingMessage = true;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Driver registration error:', err);
          this.submitting = false;
          this.errorMessage = err.error?.message || 'Driver registration failed. Please try again.';
          this.cdr.markForCheck();
        }
      });
      return;
    }

    this.user.role = 'CUSTOMER';
    this.authService.register(this.user).subscribe({
      next: (res) => {
        this.submitting = false;
        this.successMessage = 'Registration successful! Redirecting...';
        this.cdr.markForCheck();
        const role = this.authService.getUserRole() || res?.user?.role || 'CUSTOMER';
        setTimeout(() => {
          if (String(role).toUpperCase() === 'CUSTOMER') {
            this.router.navigate(['/customer/dashboard']);
          } else {
            this.router.navigate(['/login']);
          }
        }, 1000);
      },
      error: (err) => {
        console.error('Registration error:', err);
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }
}

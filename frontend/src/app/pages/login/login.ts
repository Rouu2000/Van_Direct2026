import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  credentials = {
    email: '',
    password: ''
  };
  errorMessage: string = '';
  hidePassword = true;
  submitting = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.submitting = true;
    this.cdr.markForCheck();

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.submitting = false;
        this.cdr.markForCheck();
        if (res && res.token) {
          const role = this.authService.getUserRole() || res.user?.role;
          if (role === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
          } else if (role === 'CUSTOMER') {
            this.router.navigate(['/customer/dashboard']);
          } else if (role === 'DRIVER') {
            this.router.navigate(['/driver/deliveries']);
          } else {
            this.router.navigate(['/']);
          }
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Invalid email or password.';
        this.cdr.markForCheck();
      }
    });
  }
}

import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  submitting = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    if (!this.email || !this.email.trim()) {
      return;
    }
    this.errorMessage = '';
    this.successMessage = '';
    this.submitting = true;
    this.cdr.markForCheck();

    this.authService.requestPasswordReset(this.email.trim()).subscribe({
      next: (res: any) => {
        this.submitting = false;
        this.successMessage = res?.message || 'If an account exists for that email, a reset link has been sent.';
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.submitting = false;
        // Even on error, still show standard message unless bad format
        this.errorMessage = err.error?.message || 'Failed to submit request. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }
}

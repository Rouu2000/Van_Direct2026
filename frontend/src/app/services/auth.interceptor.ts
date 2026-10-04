import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);
  const token       = authService.getToken();

  // Attach Bearer token when we have one
  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Only treat 401 as a session expiry when the request is NOT to an auth
      // endpoint (/api/auth/**). A 401 from login/register means wrong credentials,
      // not an expired session — let the component's own error handler show
      // "Invalid email or password" rather than the session-expired banner.
      const isAuthEndpoint = req.url.includes('/api/auth/');
      if (err.status === 401 && !isAuthEndpoint) {
        authService.logout();
        router.navigate(['/login'], {
          queryParams: { reason: 'session_expired' }
        });
      }
      return throwError(() => err);
    })
  );
};

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Ensures the user is logged in AND has one of the roles listed in route.data.roles.
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  authService.hydrateFromStorage();

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const expectedRoles = (route.data['roles'] as Array<string> | undefined) ?? [];
  const userRole = authService.getUserRole();

  if (userRole && expectedRoles.map(r => r.toUpperCase()).includes(userRole)) {
    return true;
  }

  // Logged in but wrong role — send to their own dashboard
  if (userRole === 'ADMIN') {
    router.navigate(['/admin/dashboard']);
  } else if (userRole === 'CUSTOMER') {
    router.navigate(['/customer/dashboard']);
  } else if (userRole === 'DRIVER') {
    router.navigate(['/driver/deliveries']);
  } else {
    router.navigate(['/login']);
  }
  return false;
};

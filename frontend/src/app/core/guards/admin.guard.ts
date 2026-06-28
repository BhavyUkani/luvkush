import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (_, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  console.log('[adminGuard] checking url:', state.url, '| isAdmin:', auth.isAdmin(), '| isLoggedIn:', auth.isLoggedIn());
  if (auth.isAdmin()) return true;
  if (auth.isLoggedIn()) {
    console.log('[adminGuard] blocking customer → /403');
    return router.createUrlTree(['/403']);
  }
  console.log('[adminGuard] blocking anonymous → /login');
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

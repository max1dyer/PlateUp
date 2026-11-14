import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

/** Sends visitors who are not signed in to the login page, then back here afterwards. */
export const signedInGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  // Wait for the remembered session to load before deciding.
  return inject(AuthService)
    .restore()
    .pipe(
      // `returnUrl` lets the login page send the user back to where they were going.
      map((user) =>
        user !== null
          ? true
          : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }),
      ),
    );
};

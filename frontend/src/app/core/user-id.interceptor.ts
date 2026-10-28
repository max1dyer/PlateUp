import { HttpInterceptorFn } from '@angular/common/http';

/** Prefix of every backend call; the dev server proxies it to the NestJS API. */
export const API_PREFIX = '/api';

/**
 * TEMPORARY: until Supabase login exists, every user of this frontend is the
 * same demo user. The backend reads this header through `@CurrentUserId()`.
 */
export const DEMO_USER_ID = 'demo-user';

/** Adds the user id header to backend calls (and only to those). */
export const userIdInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(`${API_PREFIX}/`)) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { 'x-user-id': DEMO_USER_ID } }));
};

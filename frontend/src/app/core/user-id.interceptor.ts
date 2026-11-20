import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_PREFIX, USER_ID_HEADER } from './api';
import { SessionService } from './session.service';

/**
 * Tells the backend who is signed in, on backend calls only: the Supabase
 * access token (`Authorization: Bearer ...`) when there is one, otherwise the
 * development `x-user-id` header.
 *
 * @pattern Chain of Responsibility — one handler in Angular's interceptor chain.
 */
export const userIdInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  // Leave other hosts' requests alone, so the token is never sent anywhere else.
  if (!request.url.startsWith(`${API_PREFIX}/`)) {
    return next(request);
  }
  const token = session.accessToken();
  if (token !== null) {
    return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  const userId = session.userId();
  return userId === null
    ? next(request)
    : next(request.clone({ setHeaders: { [USER_ID_HEADER]: userId } }));
};

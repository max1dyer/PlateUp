import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_PREFIX, USER_ID_HEADER } from './api';
import { SessionService } from './session.service';

/**
 * Adds the signed-in user's id header to backend calls (and only to those).
 *
 * TEMPORARY: until Supabase login exists the backend trusts this header. When
 * auth lands, this sends the access token instead.
 *
 * @pattern Chain of Responsibility — one handler in Angular's interceptor chain.
 */
export const userIdInterceptor: HttpInterceptorFn = (request, next) => {
  const userId = inject(SessionService).userId();
  // Leave other hosts' requests alone, and send nothing when no one is signed in.
  if (!request.url.startsWith(`${API_PREFIX}/`) || userId === null) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { [USER_ID_HEADER]: userId } }));
};

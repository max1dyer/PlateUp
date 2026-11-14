import { HttpErrorResponse } from '@angular/common/http';

/** Prefix of every backend call; the dev server proxies it to the NestJS API. */
export const API_PREFIX = '/api';

/** Header the backend reads the acting user from (see `@CurrentUserId()`). */
export const USER_ID_HEADER = 'x-user-id';

/** The backend's error message if it sent one, otherwise a general one. */
export function errorMessage(error: unknown): string {
  // Nest error bodies look like `{ statusCode, error, message }`; use `message` when present.
  if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
    return error.error.message;
  }
  return 'Something went wrong. Please try again.';
}

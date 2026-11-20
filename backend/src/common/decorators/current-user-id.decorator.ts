import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/** Development-only request header that carries the acting user's id (see `AuthConfig`). */
export const USER_ID_HEADER = 'x-user-id';

/** Where `AuthGuard` leaves the caller's id on the request. */
const USER_ID = Symbol('userId');

/** Records the caller's id (or null when anonymous); called by `AuthGuard`. */
export function setRequestUserId(request: Request, userId: string | null): void {
  (request as Request & { [USER_ID]?: string | null })[USER_ID] = userId;
}

/**
 * Injects the id of the signed-in user making the request, as identified by the global
 * `AuthGuard` (from a Supabase access token, or the `x-user-id` header in development).
 * Controllers and routes do not know which sign-in is in use.
 *
 * @throws UnauthorizedException (401) when nobody is signed in.
 */
export const CurrentUserId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request & { [USER_ID]?: string | null }>();
  const userId = request[USER_ID];
  if (!userId) {
    throw new UnauthorizedException('Log in to do that.');
  }
  return userId;
});

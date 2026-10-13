import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

export const USER_ID_HEADER = 'x-user-id';

/**
 * Injects the id of the user making the request.
 *
 * TEMPORARY: until authentication is implemented this reads the `x-user-id`
 * header. When auth lands, only this decorator changes (e.g. to read the id
 * from a verified token); controllers and routes stay the same.
 */
export const CurrentUserId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const userId = request.header(USER_ID_HEADER)?.trim();
  if (!userId) {
    throw new UnauthorizedException(`Missing ${USER_ID_HEADER} header.`);
  }
  return userId;
});

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { USER_ID_HEADER, setRequestUserId } from '../common/decorators/current-user-id.decorator';
import { RequestAuthenticator } from './request-authenticator';

/**
 * Global guard (registered with `APP_GUARD`) that identifies the caller of every request and
 * records their id for `@CurrentUserId()`. It lets anonymous requests through, since some routes
 * (public profiles, the auth config) need no user; `@CurrentUserId()` answers 401 on the rest.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authenticator: RequestAuthenticator) {}

  /** Always true; an invalid token makes `identify` throw 401 instead. */
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = await this.authenticator.identify({
      authorization: request.header('authorization'),
      userId: request.header(USER_ID_HEADER),
    });
    setRequestUserId(request, userId);
    return true;
  }
}

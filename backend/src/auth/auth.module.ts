import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthConfig } from './auth-config';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { DevelopmentAuthenticator } from './development-authenticator';
import { RequestAuthenticator } from './request-authenticator';
import { SupabaseAuthenticator } from './supabase-authenticator';

/**
 * Authentication: reads `AuthConfig` from the environment, picks the matching
 * `RequestAuthenticator`, and registers `AuthGuard` for every route. Exports `AuthConfig` so other
 * features can tell which sign-in is in use.
 *
 * @pattern Factory — `useFactory` chooses the authenticator from the configuration.
 */
@Module({
  controllers: [AuthController],
  providers: [
    { provide: AuthConfig, useFactory: () => AuthConfig.fromEnv(process.env) },
    {
      provide: RequestAuthenticator,
      useFactory: (config: AuthConfig): RequestAuthenticator =>
        config.usesSupabase ? new SupabaseAuthenticator(config) : new DevelopmentAuthenticator(),
      inject: [AuthConfig],
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AuthConfig],
})
export class AuthModule {}

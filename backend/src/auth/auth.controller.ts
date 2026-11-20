import { Controller, Get } from '@nestjs/common';
import { AuthClientConfig, AuthConfig } from './auth-config';

/** HTTP routes under `/auth`. */
@Controller('auth')
export class AuthController {
  constructor(private readonly config: AuthConfig) {}

  /**
   * `GET /auth/config`: which sign-in the frontend should show, with the public Supabase URL and
   * anon key when Supabase is configured. Keeps the keys in one place (the backend's `.env`).
   */
  @Get('config')
  public getConfig(): AuthClientConfig {
    return this.config.toJSON();
  }
}

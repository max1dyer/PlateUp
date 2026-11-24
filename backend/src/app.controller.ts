import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Status endpoints: `GET /api` returns a short message for people, and `GET /api/health` returns
 * JSON for the hosting platform's health check.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Returns a short "the API is up" message. */
  @Get()
  ping(): string {
    return this.appService.ping();
  }

  /** Reports that the server is up; the host restarts the app if this stops answering. */
  @Get('health')
  health(): { status: 'ok' } {
    return this.appService.health();
  }
}

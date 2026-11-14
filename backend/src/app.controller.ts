import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/** Health-check endpoint at `GET /`, used to confirm the API is running. */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Returns a short "the API is up" message. */
  @Get()
  ping(): string {
    return this.appService.ping();
  }
}

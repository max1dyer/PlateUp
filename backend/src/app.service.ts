import { Injectable } from '@nestjs/common';

/** Supplies the status responses for `AppController`. */
@Injectable()
export class AppService {
  /** The fixed message returned by `GET /`. */
  ping(): string {
    return 'PlateUp API is active.';
  }

  /** The body of `GET /health`. */
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }
}

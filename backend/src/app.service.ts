import { Injectable } from '@nestjs/common';

/** Supplies the health-check message for `AppController`. */
@Injectable()
export class AppService {
  /** The fixed message returned by `GET /`. */
  ping(): string {
    return 'PlateUp API is active.';
  }
}

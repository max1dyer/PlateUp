import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainValidationError } from '../errors/domain-validation.error';

/**
 * Keeps the domain layer free of HTTP concerns: entities throw
 * DomainValidationError and this filter turns it into a 400 response.
 *
 * @pattern Adapter — adapts the domain's error type to Nest's HTTP response.
 */
@Catch(DomainValidationError)
export class DomainErrorFilter implements ExceptionFilter<DomainValidationError> {
  public catch(error: DomainValidationError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: error.message,
    });
  }
}

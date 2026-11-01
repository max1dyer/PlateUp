import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage } from './api';

describe('errorMessage', () => {
  it("uses the backend's message when there is one", () => {
    const error = new HttpErrorResponse({ status: 400, error: { message: 'Milk is taken.' } });
    expect(errorMessage(error)).toBe('Milk is taken.');
  });

  it('falls back to a general message', () => {
    expect(errorMessage(new Error('offline'))).toBe('Something went wrong. Please try again.');
  });
});

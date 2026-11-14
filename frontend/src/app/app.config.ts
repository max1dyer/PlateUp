import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { userIdInterceptor } from './core/user-id.interceptor';

/**
 * App-wide providers: the router, and an `HttpClient` that runs every request through
 * `userIdInterceptor` so backend calls carry the signed-in user.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([userIdInterceptor])),
  ],
};

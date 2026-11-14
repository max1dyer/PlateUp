import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Entry point: starts the Angular app with the root `App` component and the app-wide providers.
bootstrapApplication(App, appConfig).catch((err) => console.error(err));

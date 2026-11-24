import { existsSync } from 'fs';
import { join } from 'path';
import { NextFunction, Request, Response } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';

/** Every API route starts with `/api` (e.g. `/api/recipes`), leaving all other paths to the frontend. */
export const API_PREFIX = 'api';

/** Room for a profile picture or recipe photo sent as a data URL (the client caps them at 1 MB). */
const JSON_BODY_LIMIT = '3mb';

/**
 * Where the production Angular build lives by default: `frontend/dist/frontend/browser`, found from
 * the compiled `backend/dist/` folder. The `FRONTEND_DIST` environment variable overrides it.
 */
export const DEFAULT_FRONTEND_DIR = join(
  __dirname,
  '..',
  '..',
  'frontend',
  'dist',
  'frontend',
  'browser',
);

/** Options for `configureApp`. */
export interface AppSetupOptions {
  /** Folder holding the built frontend (`index.html` and its assets). Skipped if it does not exist. */
  frontendDir?: string;
}

/**
 * Applies the settings shared by the real server and the interface tests: the JSON body limit, the
 * `/api` route prefix, and (when a frontend build exists) serving the Angular app from the same
 * server, so the whole application deploys as one process at one URL.
 *
 * Returns true if the frontend is being served.
 */
export function configureApp(app: NestExpressApplication, options: AppSetupOptions = {}): boolean {
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.setGlobalPrefix(API_PREFIX);

  const frontendDir = options.frontendDir;
  if (!frontendDir || !existsSync(join(frontendDir, 'index.html'))) {
    return false;
  }
  app.useStaticAssets(frontendDir, { index: false });
  app.use(spaFallback(join(frontendDir, 'index.html')));
  return true;
}

/**
 * Express middleware that answers page requests (any GET outside `/api` that was not a static file)
 * with `index.html`, so Angular's router can show the page. This is what lets a user reload
 * `/recipes/123` or open a shared link instead of getting a 404.
 */
function spaFallback(indexFile: string) {
  const apiPath = `/${API_PREFIX}`;
  return (request: Request, response: Response, next: NextFunction): void => {
    const isApiCall = request.path === apiPath || request.path.startsWith(`${apiPath}/`);
    if (request.method !== 'GET' || isApiCall) {
      next();
      return;
    }
    response.sendFile(indexFile);
  };
}

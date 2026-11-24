import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp, DEFAULT_FRONTEND_DIR } from './app.setup';

/** Port used when the host does not set `PORT` (hosting platforms such as Render set it). */
const DEFAULT_PORT = 3000;

/**
 * Entry point: builds the Nest application from `AppModule`, applies the shared setup (`/api`
 * prefix, body limit, and the built frontend if there is one), and starts listening.
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const servesFrontend = configureApp(app, {
    frontendDir: process.env.FRONTEND_DIST ?? DEFAULT_FRONTEND_DIR,
  });
  await app.listen(Number(process.env.PORT) || DEFAULT_PORT);

  const url = await app.getUrl();
  console.log(`PlateUp API running on: ${url}/api`);
  console.log(
    servesFrontend
      ? `PlateUp app running on: ${url}`
      : 'No frontend build found: run `npm run build` to serve the app from this server.',
  );
}
bootstrap();

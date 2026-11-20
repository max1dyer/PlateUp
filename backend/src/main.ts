import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

/** Room for a profile picture or recipe photo sent as a data URL (the client caps them at 1 MB). */
const JSON_BODY_LIMIT = '3mb';

/**
 * Entry point: builds the Nest application from `AppModule`, raises the JSON body limit so images
 * sent as data URLs fit, and starts listening for HTTP requests.
 */
async function bootstrap() {
  loadEnvFile();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  await app.listen(3000); // port 3000
  console.log(`PlateUp Backend running on: ${await app.getUrl()}`);
}
/**
 * Loads `backend/.env` (Supabase keys; see `.env.example`) into `process.env` when it exists.
 * Without it the app runs with the development sign-in.
 */
function loadEnvFile(): void {
  try {
    process.loadEnvFile('.env');
  } catch {
    console.log('No .env file found: using the development sign-in (x-user-id header).');
  }
}

bootstrap();

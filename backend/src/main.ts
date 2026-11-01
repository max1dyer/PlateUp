import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

/** Room for a profile picture or recipe photo sent as a data URL (the client caps them at 1 MB). */
const JSON_BODY_LIMIT = '3mb';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  await app.listen(3000); // port 3000
  console.log(`PlateUp Backend running on: ${await app.getUrl()}`);
}
bootstrap();

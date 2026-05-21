/**
 * This is not a production server yet!
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { UwsPlatformAdapter } from 'uwestjs';
import { AppModule } from './app.module';

async function bootstrap() {
  const httpAdapter = new UwsPlatformAdapter();
  const app = await NestFactory.create(AppModule, httpAdapter);
  // const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);

  // app.listen(port);

  await app.init();

  httpAdapter.listen(port, (error?: Error) => {
    if (error) {
      throw error;
    }

    Logger.log(`Application is running on: http://localhost:${port}`);
  });
}

bootstrap();

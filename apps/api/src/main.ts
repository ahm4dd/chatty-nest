/**
 * This is not a production server yet!
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { UwsPlatformAdapter } from 'uwestjs';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DocsService } from './app/docs/docs.service';

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

  const config = new DocumentBuilder()
    .setTitle('Chat Example')
    .setDescription('Chat API description')
    .setVersion('1.0')
    .addTag('Chat')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Inject into the service — fully typed, no globals
  app.get(DocsService).setDocument(document);

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

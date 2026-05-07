/**
 * This is not a production server yet!
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { apiReference } from '@scalar/nestjs-api-reference';
// TODO: wait for 2.0 of uwestjs to be released before uncommenting the following lines
// import { UwsPlatformAdapter } from 'uwestjs';

async function bootstrap() {
  // TODO: wait for 2.0 of uwestjs to be released before uncommenting the following lines
  // const httpAdapter = new UwsPlatformAdapter();
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have decorators (not defined in the DTO)
      forbidNonWhitelisted: true, // Reject requests with unknown properties
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('Chatty Nest API')
    .setDescription('API documentation for the Chatty Nest application')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);

  app.use(
    '/reference',
    apiReference({
      content: document,
      theme: 'deepSpace',
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();

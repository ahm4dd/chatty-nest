import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClsModule } from 'nestjs-cls';
import appConfig from './app/config/app.config';
import databaseConfig from './app/config/database.config';
import { DrizzleModule } from './app/database/db.module';
import { createClsConfig } from './app/config/helpers/cls.config-helper';
import { DomainEventsModule } from './app/events/domain-events.module';
import { DocsModule } from './app/docs/docs.module';
import { AuthModule } from './modules/auth/auth.module';
import { ExceptionLoggingFilter } from './app/filters/exception-logging.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env'], // TODO: introduce .env.development and .env.production and so on
    }),
    DrizzleModule.forRoot(),
    DocsModule,
    ClsModule.forRoot(createClsConfig()),
    EventEmitterModule.forRoot({
      wildcard: true, // support wildcard event listeners (e.g. 'user.*')
      delimiter: '.', // event name delimiter
      maxListeners: 10, // maximum listeners per event
      verboseMemoryLeak: true, // warn when maxListeners is exceeded
      ignoreErrors: false, // do not suppress errors from event handlers
    }),
    DomainEventsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ExceptionLoggingFilter,
    },
  ],
})
export class AppModule {}

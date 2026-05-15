import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { DrizzleModule } from './database/db.module';
import { createClsConfig } from './config/helpers/cls.config-helper';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env'], // TODO: introduce .env.development and .env.production and so on
    }),
    DrizzleModule.forRoot(),
    ClsModule.forRoot(createClsConfig()),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

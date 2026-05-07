import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import appConfig from '../modules/config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env'], // TODO: introduce .env.development and .env.production and so on
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

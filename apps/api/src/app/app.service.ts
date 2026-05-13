import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import appConfig from './config/app.config';

type AppConfigType = ConfigType<typeof appConfig>;

@Injectable()
export class AppService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfig: AppConfigType,
  ) {}
  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}

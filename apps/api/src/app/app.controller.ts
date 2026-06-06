import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { isPublic } from '../shared-kernal/infrastructure/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @isPublic()
  @Get()
  getData() {
    return this.appService.getData();
  }
}

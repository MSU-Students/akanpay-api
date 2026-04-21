import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Anonymous } from './decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Anonymous()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

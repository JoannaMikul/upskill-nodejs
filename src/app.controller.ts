import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { HelloQueryDto } from './common/schemas/hello.schema';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Query() query: HelloQueryDto): string {
    return this.appService.getHello(query.name);
  }
}

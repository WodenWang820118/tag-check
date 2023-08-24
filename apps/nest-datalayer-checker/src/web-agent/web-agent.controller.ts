import { Controller, Get, Param, Query } from '@nestjs/common';
import { WebAgentService } from './web-agent.service';

@Controller('web-agent')
export class WebAgentController {
  constructor(private readonly webAgentService: WebAgentService) {}
  // for demo purposes
  @Get('/action/:name')
  async executeAndGetDataLayer(
    @Param('name') name: string,
    @Query('args') args: string = '',
    @Query('headless') headless: string = 'false',
    @Query('path') path?: string,
  ) {
    return await this.webAgentService.executeAndGetDataLayer(
      name,
      args,
      headless,
      path,
    );
  }
}

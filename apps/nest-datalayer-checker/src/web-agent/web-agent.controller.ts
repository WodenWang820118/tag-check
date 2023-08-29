import { Controller, Get, Param, Query } from '@nestjs/common';
import { WebAgentService } from './web-agent.service';

@Controller('web-agent')
export class WebAgentController {
  constructor(private readonly webAgentService: WebAgentService) {}
  // for demo purposes
  @Get('/action/:name')
  async executeAndGetDataLayer(
    @Param('name') name: string,
    @Query('args') args = '',
    @Query('headless') headless = 'false',
    @Query('path') path?: string
  ) {
    return await this.webAgentService.executeAndGetDataLayer(
      name,
      args,
      headless,
      path
    );
  }

  @Get('/projects/:project')
  async executeAndGetDataLayerByProject(
    @Param('project') project: string,
    @Query('args') args = '',
    @Query('headless') headless = 'false',
    @Query('path') path?: string
  ) {
    return await this.webAgentService.executeAndGetDataLayerByProject(
      project,
      args,
      headless,
      path
    );
  }
}

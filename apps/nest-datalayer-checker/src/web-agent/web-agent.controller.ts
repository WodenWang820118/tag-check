import { Controller, Get, Param, Query } from '@nestjs/common';
import { WebAgentService } from './web-agent.service';

@Controller('web-agent')
export class WebAgentController {
  constructor(private readonly webAgentService: WebAgentService) {}
  // for demo purposes
  @Get('/action/:projectName/:name')
  async executeAndGetDataLayer(
    @Param('projectName') projectName: string,
    @Param('name') name: string,
    @Query('args') args = '',
    @Query('headless') headless = 'false',
    @Query('path') path?: string
  ) {
    return await this.webAgentService.executeAndGetDataLayer(
      projectName,
      name,
      args,
      headless,
      path
    );
  }

  @Get('/projects/:projectName')
  async executeAndGetDataLayerByProject(
    @Param('projectName') projectName: string,
    @Query('args') args = '',
    @Query('headless') headless = 'false',
    @Query('path') path?: string
  ) {
    return await this.webAgentService.executeAndGetDataLayerByProject(
      projectName,
      args,
      headless,
      path
    );
  }
}

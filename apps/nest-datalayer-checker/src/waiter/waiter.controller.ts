import { WaiterService } from './waiter.service';
import { Controller, Get, Query } from '@nestjs/common';

@Controller('waiter')
export class WaiterController {
  constructor(private waiterService: WaiterService) {}

  @Get('/setRootProjectFolder')
  selectRootProjectFolder(@Query('rootProjectPath') rootProjectPath: string) {
    return this.waiterService.selectRootProjectFolder(rootProjectPath);
  }

  @Get('/initProject')
  initProject(@Query('projectName') projectName: string) {
    return this.waiterService.initProject(projectName);
  }

  // if it exists, the shared service will update and use it
  @Get('/setProjectFolder')
  selectProject(@Query('projectName') projectName: string) {
    return this.waiterService.selectProject(projectName);
  }
}

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

  @Get('/inspectSingleEvent')
  async inspectSingleEvent(
    @Query('projectName') projectName: string,
    @Query('testName') testName: string,
    @Query('headless') headless: string,
    @Query('path') path?: string,
    @Query('measurementId') measurementId?: string,
    @Query('username') username?: string,
    @Query('password') password?: string
  ) {
    return await this.waiterService.inspectSingleEvent(
      projectName,
      testName,
      headless,
      path,
      measurementId,
      {
        username,
        password,
      }
    );
  }

  @Get('/inspectProject')
  async inspectProject(
    @Query('projectName') projectName: string,
    @Query('headless') headless: string,
    @Query('path') path?: string,
    @Query('measurementId') measurementId?: string,
    @Query('username') username?: string,
    @Query('password') password?: string
  ) {
    return await this.waiterService.inspectProject(
      projectName,
      headless,
      path,
      measurementId,
      {
        username,
        password,
      }
    );
  }
}

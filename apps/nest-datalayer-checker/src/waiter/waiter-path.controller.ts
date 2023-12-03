import { WaiterService } from './waiter.service';
import { Controller, Get, Header, Param, Query } from '@nestjs/common';

@Controller('waiter-path')
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

  @Get('/readImage')
  @Header('Content-Type', 'image/png')
  readImage(
    @Query('projectName') projectName: string,
    @Query('testName') testName: string
  ) {
    return this.waiterService.readImage(projectName, testName);
  }

  @Get('/projects')
  getProjects() {
    return this.waiterService.getProjects();
  }

  @Get('/projects/recordings')
  getProjectRecordings(@Query('projectName') projectName: string) {
    return this.waiterService.getProjectRecordings(projectName);
  }
}

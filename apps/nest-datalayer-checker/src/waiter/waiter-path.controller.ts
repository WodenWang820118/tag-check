import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { WaiterService } from './waiter.service';
import { Controller, Get, Header, Query } from '@nestjs/common';

@Controller('waiter-path')
export class WaiterController {
  constructor(private waiterService: WaiterService) {}

  @ApiOperation({
    summary: 'set and create a application root folder',
    description:
      'This endpoint sets and creates a root folder for the application. \
      After setup, we can create projects and run tests.',
  })
  @ApiQuery({
    name: 'rootProjectPath',
    description: 'The absolute path to the root folder of the application.',
  })
  @ApiResponse({ status: 200, description: 'Create a application root folder' })
  @Get('/set-root-project-folder')
  setRootProjectFolder(@Query('rootProjectPath') rootProjectPath: string) {
    return this.waiterService.setRootProjectFolder(rootProjectPath);
  }

  @ApiOperation({
    summary: 'init a project',
    description:
      'This endpoint sets and creates a project folder for the application. \
      Note the project folder could be created after root folder is set.',
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.',
  })
  @Get('/init-project')
  initProject(@Query('projectName') projectName: string) {
    return this.waiterService.initProject(projectName);
  }

  // if it exists, the shared service will update and use it
  @ApiOperation({
    summary: 'set and select a current project',
    description: 'Select and cache current project.',
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.',
  })
  @Get('/set-project')
  setProject(@Query('projectName') projectName: string) {
    return this.waiterService.setProject(projectName);
  }

  @ApiOperation({
    summary: 'read an image from a specifc project',
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiQuery({
    name: 'testName',
    description: 'The name of the test associated with the event.',
  })
  @Get('/read-image')
  @Header('Content-Type', 'image/png')
  readImage(
    @Query('projectName') projectName: string,
    @Query('testName') testName: string
  ) {
    return this.waiterService.readImage(projectName, testName);
  }

  @ApiOperation({
    summary: 'read a report from a specifc project',
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiQuery({
    name: 'reportName',
    description: 'The exact report name associated with the event.',
  })
  @Get('/read-report')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
  readReport(
    @Query('projectName') projectName: string,
    @Query('reportName') reportName: string
  ) {
    return this.waiterService.readReport(projectName, reportName);
  }

  @ApiOperation({
    summary: 'get all project names',
  })
  @Get('/projects')
  getProjects() {
    return this.waiterService.getProjects();
  }

  @ApiOperation({
    summary: 'get all recording file names',
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.',
  })
  @Get('/projects/recordings')
  getProjectRecordings(@Query('projectName') projectName: string) {
    return this.waiterService.getProjectRecordings(projectName);
  }

  @ApiOperation({
    summary: 'read report(s) from a specifc project',
    description:
      'This endpoint reads report(s) from a specifc project. \
      If multiple reports are found, it will return an array of report names.',
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiQuery({
    name: 'testName',
    description: 'The name of the test associated with the event.',
  })
  @Get('/projects/event-report')
  getEventReport(
    @Query('projectName') projectName: string,
    @Query('testName') testName: string
  ) {
    return this.waiterService.getEventReport(projectName, testName);
  }
}

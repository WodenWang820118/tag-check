import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { WaiterProjectService } from './waiter-project.service';
import { Body, Controller, Get, Header, Param, Query } from '@nestjs/common';

@Controller('projects')
export class WaiterProjectController {
  constructor(private waiterProjectService: WaiterProjectService) {}

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
  async setRootProjectFolder(
    @Query('rootProjectPath') rootProjectPath: string
  ) {
    await this.waiterProjectService.setRootProjectFolder(rootProjectPath);
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
  @ApiBody({
    description:
      'The settings of the project to be created. Please look at the front-end for more details.',
    type: Object,
  })
  @Get('/init-project')
  async initProject(
    @Query('projectName') projectName: string,
    @Body() settings: any
  ) {
    await this.waiterProjectService.initProject(projectName, settings);
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
  async setProject(@Query('projectName') projectName: string) {
    await this.waiterProjectService.setProject(projectName);
  }

  @ApiOperation({
    summary: 'read all projects metadata',
  })
  @Get()
  async getProjects() {
    return await this.waiterProjectService.getProjectsMetadata();
  }

  @ApiOperation({
    summary: 'read a project metadata',
  })
  @Get(':projectSlug')
  async getProject(@Param('projectSlug') projectSlug: string) {
    return await this.waiterProjectService.getProjectMetadata(projectSlug);
  }

  // TODO: could be independent of the project endpoint

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
  async readImage(
    @Query('projectName') projectName: string,
    @Query('testName') testName: string
  ) {
    return await this.waiterProjectService.readImage(projectName, testName);
  }

  // TODO: could be independent of the project endpoint

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
  async readReport(
    @Query('projectName') projectName: string,
    @Query('reportName') reportName: string
  ) {
    return await this.waiterProjectService.readReport(projectName, reportName);
  }

  // TODO: could be independent of the project endpoint

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
  async getEventReport(
    @Query('projectName') projectName: string,
    @Query('testName') testName: string
  ) {
    return await this.waiterProjectService.getEventReport(
      projectName,
      testName
    );
  }
}

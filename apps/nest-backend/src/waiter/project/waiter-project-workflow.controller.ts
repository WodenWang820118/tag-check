import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { WaiterProjectWorkFlowService } from './waiter-project-workflow.service';
import { ProjectMetadataService } from '../../project-agent/project-metadata/project-metadata.service';
import { Log } from '../../logging-interceptor/logging-interceptor.service';

@Controller('projects')
export class WaiterProjectWorkFlowController {
  constructor(
    private projectMetadataService: ProjectMetadataService,
    private waiterProjectWorkflowService: WaiterProjectWorkFlowService
  ) {}

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
    await this.waiterProjectWorkflowService.setRootProjectFolder(
      rootProjectPath
    );
  }

  @ApiOperation({
    summary: 'init a project',
    description:
      'This endpoint sets and creates a project folder for the application. \
      Note the project folder could be created after root folder is set.',
  })
  @ApiQuery({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiBody({
    description:
      'The settings of the project to be created. Please look at the front-end for more details.',
    type: Object,
  })
  @Post('/init-project/:projectSlug')
  @Log()
  async initProject(
    @Param('projectSlug') projectSlug: string,
    @Body() settings: any
  ) {
    await this.waiterProjectWorkflowService.initProject(projectSlug, settings);
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
  @Log()
  async setProject(@Query('projectName') projectName: string) {
    await this.waiterProjectWorkflowService.setProject(projectName);
  }

  @ApiOperation({
    summary: 'read all projects metadata',
  })
  @Get()
  @Log()
  async getProjects() {
    return await this.projectMetadataService.getProjectsMetadata();
  }
}

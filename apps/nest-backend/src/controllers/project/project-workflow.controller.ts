import { ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProjectWorkFlowControllerService } from './project-workflow-controller.service';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { CreateProjectDto } from '../../shared';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';

@Controller('projects')
export class ProjectWorkFlowController {
  constructor(
    private readonly projectRepositoryService: ProjectRepositoryService,
    private readonly projectWorkFlowControllerService: ProjectWorkFlowControllerService
  ) {}

  @ApiOperation({
    summary: 'init a project',
    description: `This endpoint sets and creates a project folder for the application.
      Note the project folder could be created after root folder is set.`
  })
  @ApiQuery({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiBody({
    description:
      'The settings of the project to be created. Please look at the front-end for more details.',
    type: Object
  })
  @Post('/init-project/:projectSlug')
  @Log()
  async initProject(
    @Param('projectSlug') projectSlug: string,
    @Body() settings: CreateProjectDto
  ) {
    return await this.projectWorkFlowControllerService.initProject(
      projectSlug,
      settings
    );
  }

  @ApiOperation({
    summary: 'set and select a current project',
    description: 'Select and cache current project.'
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.'
  })
  @Get('/set-project')
  @Log()
  async setProject(@Query('projectName') projectName: string) {
    await this.projectWorkFlowControllerService.setProject(projectName);
  }

  @ApiOperation({
    summary: 'read all projects metadata'
  })
  @Get()
  @Log()
  async getProjects() {
    return await this.projectRepositoryService.list();
  }
}

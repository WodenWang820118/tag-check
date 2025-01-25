import { Controller, Get, Header, Logger, Param } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProjectMetadataService } from '../../features/project-agent/project-metadata/project-metadata.service';
import { ProjectImageService } from '../../features/project-agent/project-image/project-image.service';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';

@Controller('projects')
export class ProjectDataRetrievalController {
  constructor(
    private readonly projectMetadataService: ProjectMetadataService,
    private readonly projectImageService: ProjectImageService
  ) {}

  @ApiOperation({
    summary: 'read an image from a specifc project'
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiQuery({
    name: 'testName',
    description: 'The name of the test associated with the event.'
  })
  @Get('/images/:eventId')
  @Header('Content-Type', 'image/png')
  async readImage(@Param('eventId') eventId: string) {
    Logger.log(`Reading image for event: ${eventId}`);
    return await this.projectImageService.readImage(eventId);
  }

  @ApiOperation({
    summary: 'read a project metadata'
  })
  @Get(':projectSlug')
  @Log()
  async getProject(@Param('projectSlug') projectSlug: string) {
    return await this.projectMetadataService.getProjectMetadata(projectSlug);
  }
}

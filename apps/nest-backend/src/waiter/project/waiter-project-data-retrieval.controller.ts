import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProjectMetadataService } from '../../project-agent/project-metadata/project-metadata.service';
import { ProjectImageService } from '../../project-agent/project-image/project-image.service';

@Controller('projects')
export class WaiterProjectDataRetrievalController {
  constructor(
    private projectMetadataService: ProjectMetadataService,
    private projectImageService: ProjectImageService
  ) {}

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
  @Get('/images/:projectSlug/:eventId')
  @Header('Content-Type', 'image/png')
  async readImage(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    return await this.projectImageService.readImage(projectSlug, eventId);
  }

  @ApiOperation({
    summary: 'read a project metadata',
  })
  @Get(':projectSlug')
  async getProject(@Param('projectSlug') projectSlug: string) {
    return await this.projectMetadataService.getProjectMetadata(projectSlug);
  }
}

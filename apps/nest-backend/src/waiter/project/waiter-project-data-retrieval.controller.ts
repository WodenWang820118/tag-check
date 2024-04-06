import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { WaiterProjectDataRetrievalService } from './waiter-project-data-retrieval.service';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('projects')
export class WaiterProjectDataRetrievalController {
  constructor(
    private waiterProjectDataRetrievalService: WaiterProjectDataRetrievalService
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
  @Get('/images/:projectSlug/:eventName')
  @Header('Content-Type', 'image/png')
  async readImage(
    @Param('projectSlug') projectSlug: string,
    @Param('eventName') eventName: string
  ) {
    return await this.waiterProjectDataRetrievalService.readImage(
      projectSlug,
      eventName
    );
  }

  @ApiOperation({
    summary: 'read a project metadata',
  })
  @Get(':projectSlug')
  async getProject(@Param('projectSlug') projectSlug: string) {
    return await this.waiterProjectDataRetrievalService.getProjectMetadata(
      projectSlug
    );
  }
}

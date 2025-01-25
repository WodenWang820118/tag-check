import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProjectSpecService } from '../../project-agent/project-spec/project-spec.service';
import { Spec } from '@utils';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';

@Controller('specs')
export class SpecController {
  constructor(private projectSpecService: ProjectSpecService) {}

  @ApiOperation({
    summary: 'get project specs',
    description:
      'Get all specs for a project. The project is identified by the projectSlug.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @Get(':projectSlug')
  @Log()
  async getProjectSpecs(@Param('projectSlug') projectSlug: string) {
    return await this.projectSpecService.getProjectSpecs(projectSlug);
  }

  @ApiOperation({
    summary: 'get specific spec details',
    description:
      'Get the details of a specific spec. The project is identified by the projectSlug and the spec by the eventName.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventName',
    description: 'The name of the event to which the recording belongs.'
  })
  @Get(':projectSlug/:eventName')
  @Log()
  async getSpec(
    @Param('projectSlug') projectSlug: string,
    @Param('eventName') eventName: string
  ) {
    return await this.projectSpecService.getSpec(projectSlug, eventName);
  }

  @ApiOperation({
    summary: 'add spec',
    description:
      'Add a new spec to a project. The project is identified by the projectSlug.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventName',
    description: 'The name of the event to which the recording belongs.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        spec: {
          type: 'string',
          description: 'The spec to be added.'
        }
      }
    }
  })
  @Post(':projectSlug')
  @Log()
  async addSpec(@Param('projectSlug') projectSlug: string, @Body() spec: Spec) {
    return await this.projectSpecService.addSpec(projectSlug, spec);
  }

  @ApiOperation({
    summary: 'update spec',
    description:
      'Update a spec. The project is identified by the projectSlug and the spec by the eventName.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventName',
    description: 'The name of the event to which the recording belongs.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        spec: {
          type: 'string',
          description: 'The spec to be updated.'
        }
      }
    }
  })
  @Put(':projectSlug/:eventName')
  @Log()
  async updateSpec(
    @Param('projectSlug') projectSlug: string,
    @Param('eventName') eventName: string,
    @Body() spec: Spec
  ) {
    return await this.projectSpecService.updateSpec(
      projectSlug,
      eventName,
      spec
    );
  }
}

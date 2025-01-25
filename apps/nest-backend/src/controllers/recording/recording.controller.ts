import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Recording } from '@utils';
import { ProjectRecordingService } from '../../project-agent/project-recording/project-recording.service';
import { Log } from '../../logging-interceptor/logging-interceptor.service';

@Controller('recordings')
export class RecordingController {
  constructor(private projectRecordingService: ProjectRecordingService) {}

  @ApiOperation({
    summary: 'get project recordings',
    description:
      'Get all recordings for a project. The project is identified by the projectSlug.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @Get(':projectSlug')
  @Log()
  async getProjectRecordings(@Param('projectSlug') projectSlug: string) {
    return await this.projectRecordingService.getProjectRecordings(projectSlug);
  }

  @ApiOperation({
    summary: 'get project recording names',
    description:
      'Get all recording names for a project. The project is identified by the projectSlug.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @Get(':projectSlug/names')
  @Log()
  async getProjectRecordingNames(@Param('projectSlug') projectSlug: string) {
    return await this.projectRecordingService.getProjectRecordingNames(
      projectSlug
    );
  }

  @ApiOperation({
    summary: 'get specific recording details',
    description:
      'Get the details of a specific recording. The project is identified by the projectSlug and the recording by the eventName.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventId',
    description: 'The name of the event to which the recording belongs.'
  })
  @Get(':projectSlug/:eventId')
  @Log()
  async getRecordingDetails(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    return await this.projectRecordingService.getRecordingDetails(
      projectSlug,
      eventId
    );
  }

  @ApiOperation({
    summary: 'add recording',
    description:
      'Add a recording to an event. The project is identified by the projectSlug and the event by the eventId.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventId',
    description: 'The name of the event to which the recording belongs.'
  })
  @ApiBody({
    description: 'The recording to be added to the event.'
  })
  @Post(':projectSlug/:eventId')
  @Log()
  async addRecording(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Body() recording: Recording
  ) {
    return await this.projectRecordingService.addRecording(
      projectSlug,
      eventId,
      recording
    );
  }

  @ApiOperation({
    summary: 'update recording',
    description:
      'Update a recording for an event. The project is identified by the projectSlug and the event by the eventId.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventId',
    description: 'The name of the event to which the recording belongs.'
  })
  @ApiBody({
    description: 'The updated recording.'
  })
  @Put(':projectSlug/:eventId')
  @Log()
  async updateRecording(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Body() recording: Recording
  ) {
    return await this.projectRecordingService.updateRecording(
      projectSlug,
      eventId,
      recording
    );
  }
}

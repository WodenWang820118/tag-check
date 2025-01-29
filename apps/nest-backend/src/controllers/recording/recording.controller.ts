import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Recording } from '@utils';
import { ProjectRecordingService } from '../../features/project-agent/project-recording/project-recording.service';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { ProjectFacadeRepositoryService } from '../../features/repository/project-facade/project-facade-repository.service';
import { RecordingRepositoryService } from '../../core/repository/recording/recording-repository.service';

@Controller('recordings')
export class RecordingController {
  constructor(
    private projectRecordingService: ProjectRecordingService,
    private projectFacadeRepositoryService: ProjectFacadeRepositoryService,
    private recordingRepositoryService: RecordingRepositoryService
  ) {}

  @Get(':projectSlug')
  @Log()
  async getRecordings(@Param('projectSlug') projectSlug: string) {
    return await this.recordingRepositoryService.listByProject(projectSlug);
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
    return await this.recordingRepositoryService.getRecordingDetails(
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
    return await this.recordingRepositoryService.create({
      title: recording.title,
      steps: recording.steps
    });
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
    return await this.recordingRepositoryService.update(projectSlug, eventId, {
      title: recording.title,
      steps: recording.steps
    });
  }
}

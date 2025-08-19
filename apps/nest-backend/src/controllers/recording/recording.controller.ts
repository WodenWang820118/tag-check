import { Body, Controller, Get, Logger, Param, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Recording } from '@utils';
import { ProjectRecordingService } from '../../features/project-agent/project-recording/project-recording.service';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { ProjectFacadeRepositoryService } from '../../features/repository/project-facade/project-facade-repository.service';
import { RecordingRepositoryService } from '../../core/repository/recording/recording-repository.service';

@Controller('recordings')
export class RecordingController {
  private readonly logger = new Logger(RecordingController.name);
  constructor(
    private readonly projectRecordingService: ProjectRecordingService,
    private readonly projectFacadeRepositoryService: ProjectFacadeRepositoryService,
    private readonly recordingRepositoryService: RecordingRepositoryService
  ) {}

  @Get(':projectSlug')
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

import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import type { Recording } from '@utils';
import { ProjectRecordingService } from '../../features/project-agent/project-recording/project-recording.service';
import { RecordingRepositoryService } from '../../core/repository/recording/recording-repository.service';

/** Reads and updates tests' Chrome Recorder recordings. */
@Controller('recordings')
export class RecordingController {
  constructor(
    private readonly projectRecordingService: ProjectRecordingService,
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
  async updateRecording(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Body() recording: Recording
  ) {
    const updated = await this.recordingRepositoryService.update(
      projectSlug,
      eventId,
      { title: recording.title, steps: recording.steps }
    );
    // Keep the recording file in the project folder in step: a run reads
    // the site's domain from it, and an exported zip carries it.
    await this.projectRecordingService.updateRecording(projectSlug, eventId, {
      title: recording.title,
      steps: recording.steps
    });
    return updated;
  }
}

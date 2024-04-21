import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WaiterRecordingService } from './waiter-recording.service';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('recordings')
export class WaiterRecordingController {
  constructor(private waiterRecordingService: WaiterRecordingService) {}

  @ApiOperation({
    summary: 'get project recordings',
    description:
      'Get all recordings for a project. The project is identified by the projectSlug.',
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.',
  })
  @Get(':projectSlug')
  async getProjectRecordings(@Param('projectSlug') projectSlug: string) {
    return await this.waiterRecordingService.getProjectRecordings(projectSlug);
  }

  @ApiOperation({
    summary: 'get project recording names',
    description:
      'Get all recording names for a project. The project is identified by the projectSlug.',
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.',
  })
  @Get(':projectSlug/names')
  async getProjectRecordingNames(@Param('projectSlug') projectSlug: string) {
    return await this.waiterRecordingService.getProjectRecordingNames(
      projectSlug
    );
  }

  @ApiOperation({
    summary: 'get specific recording details',
    description:
      'Get the details of a specific recording. The project is identified by the projectSlug and the recording by the eventName.',
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'The name of the event to which the recording belongs.',
  })
  @Get(':projectSlug/:eventId')
  async getRecordingDetails(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    return await this.waiterRecordingService.getRecordingDetails(
      projectSlug,
      eventId
    );
  }

  @Post(':projectSlug/:eventId')
  async addRecording(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Body() recording: any
  ) {
    return await this.waiterRecordingService.addRecording(
      projectSlug,
      eventId,
      recording
    );
  }
}

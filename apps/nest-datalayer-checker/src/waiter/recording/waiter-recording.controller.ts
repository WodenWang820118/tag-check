import { Controller, Get, Param } from '@nestjs/common';
import { WaiterRecordingService } from './waiter-recording.service';

@Controller('recordings')
export class WaiterRecordingController {
  constructor(private waiterRecordingService: WaiterRecordingService) {}

  @Get(':projectSlug')
  async getProjectRecordings(@Param('projectSlug') projectSlug: string) {
    return await this.waiterRecordingService.getProjectRecordings(projectSlug);
  }

  @Get(':projectSlug/:eventName')
  async getRecordingDetails(
    @Param('projectSlug') projectSlug: string,
    @Param('eventName') eventName: string
  ) {
    return await this.waiterRecordingService.getRecordingDetails(
      projectSlug,
      eventName
    );
  }
}

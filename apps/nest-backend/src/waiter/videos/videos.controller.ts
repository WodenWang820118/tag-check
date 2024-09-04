import { Controller, Get, Header, Param } from '@nestjs/common';
import { ProjectVideoService } from '../../project-agent/project-video/project-video.service';

@Controller('videos')
export class WaiterVideosController {
  constructor(private projectVideoService: ProjectVideoService) {}

  @Header('Content-Type', 'video/webm')
  @Header('Content-Disposition', `inline; filename="recording.webm"`)
  @Get(':projectSlug/:eventId')
  async getVideos(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    return await this.projectVideoService.getVideos(projectSlug, eventId);
  }
}

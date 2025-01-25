import { Controller, Get, Header, Param } from '@nestjs/common';
import { ProjectVideoService } from '../../project-agent/project-video/project-video.service';
import { Log } from '../../logging-interceptor/logging-interceptor.service';

@Controller('videos')
export class VideosController {
  constructor(private projectVideoService: ProjectVideoService) {}

  @Header('Content-Type', 'video/webm')
  @Header('Content-Disposition', `inline; filename="recording.webm"`)
  @Get(':projectSlug/:eventId')
  @Log()
  async getVideos(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    return await this.projectVideoService.getVideos(projectSlug, eventId);
  }
}

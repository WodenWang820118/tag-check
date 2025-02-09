import { Controller, Get, Header, Param } from '@nestjs/common';
import { ProjectVideoService } from '../../features/project-agent/project-video/project-video.service';

@Controller('videos')
export class VideosController {
  constructor(private projectVideoService: ProjectVideoService) {}

  @Header('Content-Type', 'video/webm')
  @Header('Content-Disposition', `inline; filename="recording.webm"`)
  @Header('Cache-Control', 'max-age=300')
  @Header('Access-Control-Expose-Headers', 'Content-Disposition')
  @Get(':projectSlug/:eventId')
  async getVideos(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    return await this.projectVideoService.getVideos(projectSlug, eventId);
  }
}

import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProjectVideoService } from '../../features/project-agent/project-video/project-video.service';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';

@Controller('videos')
export class VideosController {
  constructor(private projectVideoService: ProjectVideoService) {}

  @Header('Content-Type', 'video/webm')
  @Header('Content-Disposition', `inline; filename="recording.webm"`)
  @Header('Cache-Control', 'max-age=300')
  @Get(':projectSlug/:eventId')
  @Log()
  async getVideos(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Res({ passthrough: true }) response: Response
  ) {
    const { streamableFile, hasVideo } =
      await this.projectVideoService.getVideos(projectSlug, eventId);

    // Set custom header to indicate video availability
    response.setHeader('X-Video-Available', hasVideo ? 'true' : 'false');

    return streamableFile;
  }
}

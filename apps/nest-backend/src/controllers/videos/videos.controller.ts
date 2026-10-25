import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ProjectVideoService } from '../../features/project-agent/project-video/project-video.service';

import { RECORDING_FILES } from '../../shared';

/** Serves a test's latest screen recordings. */
@Controller('videos')
export class VideosController {
  constructor(private readonly projectVideoService: ProjectVideoService) {}

  @Header('Content-Type', 'video/webm')
  @Header('Content-Disposition', `inline; filename="recording.webm"`)
  // Every run overwrites the recording, so the browser must revalidate:
  // a cached copy would keep showing the previous (or empty) recording.
  @Header('Cache-Control', 'no-cache')
  @Header('Access-Control-Expose-Headers', 'Content-Disposition')
  @Get(':projectSlug/:eventId')
  async getVideos(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    // `tag-assistant` serves the Tag Assistant recording of an
    // accompanied-mode run; anything else serves the site recording.
    @Query('view') view?: string
  ) {
    return await this.projectVideoService.getVideos(
      projectSlug,
      eventId,
      view === 'tag-assistant'
        ? RECORDING_FILES.tagAssistant
        : RECORDING_FILES.site
    );
  }
}

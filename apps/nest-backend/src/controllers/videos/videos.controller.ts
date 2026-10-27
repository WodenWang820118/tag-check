import {
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Query
} from '@nestjs/common';
import { ProjectVideoService } from '../../features/project-agent/project-video/project-video.service';

import { RECORDING_FILES } from '../../shared';

/** Serves a run's screen recordings, the test's latest run's by default. */
@Controller('videos')
export class VideosController {
  constructor(private readonly projectVideoService: ProjectVideoService) {}

  @Header('Content-Type', 'video/webm')
  @Header('Content-Disposition', `inline; filename="recording.webm"`)
  // Without `?run=` the URL serves the latest run's recording, which the
  // next run replaces, so the browser must revalidate: a cached copy would
  // keep showing the previous (or empty) recording.
  @Header('Cache-Control', 'no-cache')
  @Header('Access-Control-Expose-Headers', 'Content-Disposition')
  @Get(':projectSlug/:eventId')
  async getVideos(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    // `tag-assistant` serves the Tag Assistant recording of an
    // accompanied-mode run; anything else serves the site recording.
    @Query('view') view?: string,
    // `?run=<runId>` picks the run; the test's latest run by default.
    @Query('run', new ParseIntPipe({ optional: true })) run?: number
  ) {
    return await this.projectVideoService.getVideos(
      projectSlug,
      eventId,
      view === 'tag-assistant'
        ? RECORDING_FILES.tagAssistant
        : RECORDING_FILES.site,
      run
    );
  }
}

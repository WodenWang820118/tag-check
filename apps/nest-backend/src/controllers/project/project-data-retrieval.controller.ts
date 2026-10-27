import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  StreamableFile
} from '@nestjs/common';
import { TestImageRepositoryService } from '../../core/repository/test-event/test-image-repository.service';
import { TestEventDetailRepositoryService } from '../../core/repository/test-event/test-event-detail-repository.service';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import { ProjectGtmContainerService } from '../../features/project-agent/project-gtm-container/project-gtm-container.service';

/** Serves a project, its tests' run screenshots and its GTM container. */
@Controller('projects')
export class ProjectDataRetrievalController {
  constructor(
    private readonly testImageRepositoryService: TestImageRepositoryService,
    private readonly testEventDetailRepositoryService: TestEventDetailRepositoryService,
    private readonly projectRepositoryService: ProjectRepositoryService,
    private readonly projectGtmContainerService: ProjectGtmContainerService
  ) {}

  @Get('/images/:projectSlug/:eventId')
  @Header('Content-Type', 'image/png')
  @Header('Cache-Control', 'no-cache')
  async readImage(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    // `?run=<runId>` picks the run; the test's latest screenshot by default.
    @Query('run', new ParseIntPipe({ optional: true })) run?: number
  ) {
    const image =
      run === undefined
        ? await this.testImageRepositoryService.getBySlugAndEventId(
            projectSlug,
            eventId
          )
        : await this.testEventDetailRepositoryService.getRunScreenshot(
            projectSlug,
            eventId,
            run,
            true
          );
    // A test that has not run yet has no screenshot: answer with an empty
    // body, which the report shows as "No media available".
    if (!image?.imageData) {
      return new StreamableFile(Buffer.from(''));
    }
    return new StreamableFile(image.imageData);
  }

  @Get(':projectSlug')
  async getProject(@Param('projectSlug') projectSlug: string) {
    return this.projectRepositoryService.getBySlug(projectSlug);
  }

  /**
   * The GTM container the project imported, which the report page uses to
   * resolve tag variables. It is read from the project's config folder on
   * every request: a cached copy would outlive the next container import.
   *
   * @throws NotFoundException when the project has no readable container.
   */
  @Get(':projectSlug/gtm-config')
  async getGtmConfig(@Param('projectSlug') projectSlug: string) {
    const container = await this.projectGtmContainerService.read(projectSlug);
    if (!container) {
      throw new NotFoundException(
        `No GTM container imported for project '${projectSlug}'`
      );
    }
    return container;
  }
}

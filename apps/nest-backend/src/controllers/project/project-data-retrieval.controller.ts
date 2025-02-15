import {
  Controller,
  Get,
  Header,
  Logger,
  Param,
  StreamableFile
} from '@nestjs/common';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { TestImageRepositoryService } from '../../core/repository/test-event/test-image-repository.service';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';

@Controller('projects')
export class ProjectDataRetrievalController {
  constructor(
    private readonly testImageRepositoryService: TestImageRepositoryService,
    private readonly projectRepositoryService: ProjectRepositoryService
  ) {}

  @Get('/images/:projectSlug/:eventId')
  @Header('Content-Type', 'image/png')
  async readImage(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    const image = await this.testImageRepositoryService.getBySlugAndEventId(
      projectSlug,
      eventId
    );
    try {
      return new StreamableFile(image.imageData);
    } catch (error) {
      Logger.error(error);
      return new StreamableFile(Buffer.from(''));
    }
  }

  @Get(':projectSlug')
  @Log()
  async getProject(@Param('projectSlug') projectSlug: string) {
    return this.projectRepositoryService.getBySlug(projectSlug);
  }
}

import {
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  StreamableFile,
  UseInterceptors
} from '@nestjs/common';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { TestImageRepositoryService } from '../../core/repository/test-event/test-image-repository.service';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import { FileService } from '../../infrastructure/os/file/file.service';
import { GTMConfiguration } from '@utils';
import { join } from 'path';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('projects')
export class ProjectDataRetrievalController {
  constructor(
    private readonly testImageRepositoryService: TestImageRepositoryService,
    private readonly projectRepositoryService: ProjectRepositoryService,
    private readonly fileService: FileService
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

  @UseInterceptors(CacheInterceptor)
  @Get(':projectSlug/gtm-config')
  // @Log()
  async getGtmConfig(@Param('projectSlug') projectSlug: string) {
    const gtmConfigPath =
      await this.projectRepositoryService.getGtmConfigBySlug(projectSlug);
    if (!gtmConfigPath) {
      throw new HttpException(
        'GTM config path not found',
        HttpStatus.NOT_FOUND
      );
    }
    try {
      return this.fileService.readJsonFile<GTMConfiguration>(
        join(gtmConfigPath, 'gtm-container.json')
      );
    } catch (error) {
      Logger.error(error);
      throw new HttpException(
        'Failed to retrieve GTM config',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

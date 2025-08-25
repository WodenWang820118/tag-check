import { ProjectInitializationService } from './../project-agent/project-initialization/project-initialization.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProjectDto } from '../../shared';
import { Cookie, LocalStorage } from '@utils';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import { ApplicationSettingRepositoryService } from '../../core/repository/settings/application-setting-repository.service';
import { ExampleEventsBuilderService } from './example-events-builder.service';
import { exampleGtmJson } from './gtm-json';
import { FileService } from '../../infrastructure/os/file/file.service';
import { FolderPathService } from '../../infrastructure/os/path/folder-path/folder-path.service';
import { join } from 'path';

@Injectable()
export class ExampleProjectRepositoryService implements OnModuleInit {
  private readonly logger = new Logger(ExampleProjectRepositoryService.name);
  private readonly DEFAULT_WEBSITE_URL =
    'https://ng-gtm-integration-sample.vercel.app/home';

  constructor(
    private readonly projectRepositoryService: ProjectRepositoryService,
    private readonly projectInitializationService: ProjectInitializationService,
    private readonly exampleEventsBuilderService: ExampleEventsBuilderService,
    private readonly applicationSettingRepositoryService: ApplicationSettingRepositoryService,
    private readonly fileService: FileService,
    private readonly folderPathService: FolderPathService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.buildExampleProject();
  }

  async buildExampleProject() {
    this.logger.debug('Building example project');
    try {
      const projects = await this.projectRepositoryService.list();
      if (projects.length > 0) return;

      // 1. create a project with basic settings
      const projectSlug = 'example-project-slug';
      const configFolder =
        await this.folderPathService.getProjectConfigFolderPath(projectSlug);
      const createProjectDto: CreateProjectDto = {
        projectSlug: projectSlug,
        projectName: 'Example Project',
        projectDescription: 'This is an example project',
        gtmConfigurationPath: configFolder
      };

      // First, initialize the project in the database and file system
      await this.projectInitializationService.initProjectFileSystem(
        projectSlug,
        createProjectDto
      );

      // Write example GTM JSON to the project's config folder
      try {
        const filePath = join(configFolder, 'gtm-container.json');
        this.logger.debug(`Writing example GTM JSON to ${filePath}`);
        this.fileService.writeJsonFile(filePath, exampleGtmJson);
      } catch (err) {
        this.logger.warn('Failed to write example GTM JSON file: ' + err);
      }

      await this.exampleEventsBuilderService.buildEvents(projectSlug);

      const projectEntity =
        await this.projectRepositoryService.getEntityBySlug(projectSlug);
      this.logger.log(
        'Updating application settings for project:',
        projectEntity
      );
      await this.applicationSettingRepositoryService.update(projectEntity, {
        localStorage: this.localStorageSettings(),
        cookie: this.cookieSettings(),
        websiteUrl: this.DEFAULT_WEBSITE_URL
      });
    } catch (error) {
      this.logger.error('Failed to build example project:', error);
      throw error;
    }
  }

  private localStorageSettings() {
    const localStorage: LocalStorage = {
      data: [
        {
          key: 'consent',
          value: 'true'
        },
        {
          key: 'consentPreferences',
          value:
            '{"ad_storage":true,"analytics_storage":true,"ad_user_data":true,"ad_personalization":false}'
        }
      ]
    };
    return localStorage;
  }

  private cookieSettings() {
    const cookie: Cookie = {
      data: []
    };
    return cookie;
  }
}

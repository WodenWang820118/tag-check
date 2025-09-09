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
  // Default constants for the example project. Move these here so they're
  // easy to change from a single place.
  private readonly DEFAULT_PROJECT_SLUG = 'example-project-slug';
  private readonly DEFAULT_PROJECT_NAME = 'Example Project';
  private readonly DEFAULT_PROJECT_DESCRIPTION = 'This is an example project';
  private readonly DEFAULT_MEASUREMENT_ID = 'G-8HK542DQMG';
  private readonly DEFAULT_GTM_FILENAME = 'gtm-container.json';
  private readonly DEFAULT_WEBSITE_URL =
    'https://ng-gtm-integration-sample.vercel.app/home';
  private readonly DEFAULT_TAG_MANAGER_URL =
    'https://tagmanager.google.com/#/container/accounts/6140708819/containers/168785492/workspaces/52';
  private readonly DEFAULT_GTM_PREVIEW_MODE_URL =
    'https://tagassistant.google.com/#/?id=GTM-NBMX2DWS&url=https%3A%2F%2Fng-gtm-integration-sample.vercel.app%2Fhome%3Fgtm_debug%3D1757377220341&source=TAG_MANAGER&gtm_auth=eLtZEClHVwwGkk2zpmmJ1w&gtm_preview=env-272';
  // Default localStorage seed for the example project. Centralized here
  // so it can be modified easily and tested.
  private readonly DEFAULT_LOCAL_STORAGE: LocalStorage = {
    data: [
      { key: 'consent', value: 'true' },
      {
        key: 'consentPreferences',
        value:
          '{"ad_storage":true,"analytics_storage":true,"ad_user_data":true,"ad_personalization":false}'
      }
    ]
  };

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
      const projectSlug = this.DEFAULT_PROJECT_SLUG;
      const configFolder =
        await this.folderPathService.getProjectConfigFolderPath(projectSlug);
      const createProjectDto: CreateProjectDto = {
        projectSlug: projectSlug,
        projectName: this.DEFAULT_PROJECT_NAME,
        projectDescription: this.DEFAULT_PROJECT_DESCRIPTION,
        gtmConfigurationPath: configFolder,
        measurementId: this.DEFAULT_MEASUREMENT_ID
      };

      // First, initialize the project in the database and file system
      await this.projectInitializationService.initProjectFileSystem(
        projectSlug,
        createProjectDto
      );

      // Write example GTM JSON to the project's config folder
      try {
        const filePath = join(configFolder, this.DEFAULT_GTM_FILENAME);
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
        localStorage: this.DEFAULT_LOCAL_STORAGE,
        cookie: this.cookieSettings(),
        websiteUrl: this.DEFAULT_WEBSITE_URL,
        gtm: {
          isAccompanyMode: true,
          isRequestCheck: true,
          tagManagerUrl: this.DEFAULT_TAG_MANAGER_URL,
          gtmPreviewModeUrl: this.DEFAULT_GTM_PREVIEW_MODE_URL
        }
      });
    } catch (error) {
      this.logger.error('Failed to build example project:', error);
      throw error;
    }
  }

  private cookieSettings() {
    const cookie: Cookie = {
      data: []
    };
    return cookie;
  }
}

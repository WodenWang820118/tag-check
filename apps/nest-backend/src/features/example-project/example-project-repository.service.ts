import { ProjectInitializationService } from './../project-agent/project-initialization/project-initialization.service';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { CreateProjectDto } from '../../shared';
import { Cookie, LocalStorage } from '@utils';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import { ApplicationSettingRepositoryService } from '../../core/repository/settings/application-setting-repository.service';
import { ExampleEventsBuilderService } from './example-events-builder.service';
import { exampleGtmJson } from './gtm-json';
import { FileService } from '../../infrastructure/os/file/file.service';
import { FolderPathService } from '../../infrastructure/os/path/folder-path/folder-path.service';
import { join } from 'path';

export interface ExampleProjectStartupReadiness {
  ready: boolean;
  projectCount: number;
  inFlight: boolean;
  error: string | null;
}

@Injectable()
export class ExampleProjectRepositoryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ExampleProjectRepositoryService.name);
  private startupReadiness: ExampleProjectStartupReadiness = {
    ready: false,
    projectCount: 0,
    inFlight: false,
    error: null
  };
  private startupSeedPromise: Promise<number> | null = null;
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

  async onApplicationBootstrap(): Promise<void> {
    // Fire-and-forget: do NOT await. Seeding is decorative (creates the
    // example project on first launch) and must not block app.listen() or
    // request handling. Readiness is observable via getStartupSeedReadiness()
    // and the StartupReadinessController.
    void this.scheduleStartupSeed();
  }

  /**
   * Internal entry point used by the lifecycle hook and by tests.
   * Returns the in-flight promise so tests can await completion deterministically.
   */
  scheduleStartupSeed(): Promise<number> {
    if (this.startupSeedPromise) {
      return this.startupSeedPromise;
    }
    this.startupReadiness = {
      ready: false,
      projectCount: 0,
      inFlight: true,
      error: null
    };
    const startedAt = Date.now();
    this.logger.log('Example project startup seed scheduled (non-blocking)');
    this.startupSeedPromise = (async () => {
      try {
        const projectCount = await this.buildExampleProject();
        this.startupReadiness = {
          ready: true,
          projectCount,
          inFlight: false,
          error: null
        };
        this.logger.log(
          `Example project startup seed finished in ${
            Date.now() - startedAt
          }ms; ${projectCount} project(s) visible`
        );
        return projectCount;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.startupReadiness = {
          ready: false,
          projectCount: 0,
          inFlight: false,
          error: message
        };
        this.logger.error(
          `Example project startup seed failed after ${
            Date.now() - startedAt
          }ms: ${message}`
        );
        throw error;
      }
    })();
    return this.startupSeedPromise;
  }

  getStartupSeedReadiness(): ExampleProjectStartupReadiness {
    return { ...this.startupReadiness };
  }

  /**
   * Awaits the in-flight startup seed if one is running, otherwise schedules
   * one and awaits it. Idempotent and safe to call from any consumer that
   * needs the example project to exist before reading the project list.
   *
   * Errors during seeding are swallowed here so that callers (e.g. the
   * project list endpoint) can degrade gracefully — the underlying error is
   * already logged inside scheduleStartupSeed() and remains observable via
   * getStartupSeedReadiness().error.
   */
  async ensureSeededOnce(): Promise<void> {
    if (this.startupReadiness.ready) {
      return;
    }
    if (this.startupReadiness.error !== null) {
      // A previous seed attempt failed; do not retry on every request.
      return;
    }
    try {
      await this.scheduleStartupSeed();
    } catch {
      // Already logged + recorded in startupReadiness.error.
    }
  }

  async buildExampleProject(): Promise<number> {
    this.logger.debug('Checking example project startup seed state');
    try {
      const projects = await this.projectRepositoryService.list();
      if (projects.length > 0) {
        this.logger.log(
          `Example project startup seed skipped; ${projects.length} project(s) already visible`
        );
        return projects.length;
      }
      this.logger.log('Example project startup seed creating example project');

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

      const visibleProjects = await this.projectRepositoryService.list();
      if (visibleProjects.length === 0) {
        throw new Error(
          'Example project startup seed completed but no projects are visible'
        );
      }
      this.logger.log(
        `Example project startup seed finished; ${visibleProjects.length} project(s) visible to project list`
      );
      return visibleProjects.length;
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

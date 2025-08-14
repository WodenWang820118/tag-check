import { ProjectInitializationService } from './../project-agent/project-initialization/project-initialization.service';
import { ProjectReportService } from '../project-agent/project-report/project-report.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateFullTestEventDto, CreateProjectDto } from '../../shared';
import { TestReportFacadeRepositoryService } from '../repository/test-report-facade/test-report-facade-repository.service';
import { Cookie, IReportDetails, LocalStorage, Recording, Spec } from '@utils';
import { exampleRecording } from './example-recording';
import { exampleSpec } from './example-spec';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import { ApplicationSettingRepositoryService } from '../../core/repository/settings/application-setting-repository.service';

@Injectable()
export class ExampleProjectRepositoryService implements OnModuleInit {
  private readonly logger = new Logger(ExampleProjectRepositoryService.name);
  private readonly DEFAULT_WEBSITE_URL =
    'https://gtm-integration-sample.netlify.app';

  constructor(
    private readonly testReportFacadeRepositoryService: TestReportFacadeRepositoryService,
    private readonly projectRepositoryService: ProjectRepositoryService,
    private readonly projectInitializationService: ProjectInitializationService,
    private readonly projectReportService: ProjectReportService,
    private readonly applicationSettingRepositoryService: ApplicationSettingRepositoryService
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
      const eventId = '5dfb6b1f-3496-4862-81f6-87bdccfb0be4';
      const createProjectDto: CreateProjectDto = {
        projectSlug: projectSlug,
        projectName: 'Example Project',
        projectDescription: 'This is an example project'
      };

      // First, initialize the project in the database and file system
      await this.projectInitializationService.initProjectFileSystem(
        projectSlug,
        createProjectDto
      );

      // 2. create a full test event
      const reportDetail: IReportDetails = {
        position: 0,
        event: 'page_view',
        eventName: 'page_view',
        testName: 'Standard Page View',
        eventId: eventId,
        stopNavigation: false,
        message: 'This is a standard page view test',
        passed: false,
        requestPassed: false,
        rawRequest: '',
        destinationUrl: '',
        dataLayer: [],
        reformedDataLayer: [],
        createdAt: new Date()
      };

      const recording: Recording = {
        ...exampleRecording
      };

      const spec: Spec = {
        ...exampleSpec
      };

      const fullReport: CreateFullTestEventDto = {
        reportDetails: reportDetail,
        recording: recording,
        spec: spec
      };

      // Now create the event report folder
      await this.projectReportService.createEventReportFolder(
        projectSlug,
        eventId
      );

      // Finally create the full report after the project exists
      await this.testReportFacadeRepositoryService.createFullReport(
        projectSlug,
        eventId,
        fullReport
      );

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

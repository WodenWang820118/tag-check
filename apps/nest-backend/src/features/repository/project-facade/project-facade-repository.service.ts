import { Injectable } from '@nestjs/common';
import { ProjectRepositoryService } from '../../../core/repository/project/project-repository.service';
import { AuthenticationSettingRepositoryService } from '../../../core/repository/settings/authentication-setting-repository.service';
import { BrowserSettingRepositoryService } from '../../../core/repository/settings/browser-setting-repository.service';
import { ApplicationSettingRepositoryService } from '../../../core/repository/settings/application-setting-repository.service';
import { RecordingRepositoryService } from '../../../core/repository/recording/recording-repository.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';
import {
  CreateApplicationSettingDto,
  CreateAuthenticationSettingDto,
  CreateBrowserSettingDto,
  CreateProjectDto,
  CreateSpecDto
} from '../../../shared';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';

@Injectable()
export class ProjectFacadeRepositoryService {
  constructor(
    private projectRepositoryService: ProjectRepositoryService,
    private authenticationRepositoryService: AuthenticationSettingRepositoryService,
    private browserRepositoryService: BrowserSettingRepositoryService,
    private applicationRepositoryService: ApplicationSettingRepositoryService,
    private recordingRepositoryService: RecordingRepositoryService,
    private specRepositoryService: SpecRepositoryService,
    private testEventRepositoryService: TestEventRepositoryService
  ) {}

  async createProject(projectSlug: string, settings: CreateProjectDto) {
    const initializedProjectInfo: CreateProjectDto = {
      projectSlug: projectSlug,
      projectName: settings.projectName || '',
      projectDescription: settings.projectDescription || '',
      measurementId: settings.measurementId || ''
    };

    const authenticationSetting: CreateAuthenticationSettingDto = {
      username: '',
      password: ''
    };

    const browserSetting: CreateBrowserSettingDto = {
      headless: true,
      browser: []
    };

    const applicationSetting: CreateApplicationSettingDto = {
      localStorage: {
        data: []
      },
      cookie: {
        data: []
      },
      gtm: {
        isAccompanyMode: false,
        isRequestCheck: false,
        tagManagerUrl: '',
        gtmPreviewModeUrl: ''
      },
      preventNavigationEvents: []
    };

    const spec: CreateSpecDto = {
      event: 'page_view',
      specData: {
        event: 'page_view'
      }
    };

    await this.projectRepositoryService.create(initializedProjectInfo);
    await this.applicationRepositoryService.create(applicationSetting);
    await this.authenticationRepositoryService.create(authenticationSetting);
    await this.browserRepositoryService.create(browserSetting);
    await this.specRepositoryService.create(spec);
  }
}

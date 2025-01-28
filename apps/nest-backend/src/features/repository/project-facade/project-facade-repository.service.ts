import { Injectable } from '@nestjs/common';
import { ProjectInfoRepositoryService } from '../../../core/repository/project/project-info-repository.service';
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
  CreateProjectInfoDto,
  CreateRecordingDto,
  CreateSpecDto,
  ProjectInfoDto
} from '../../../shared';

@Injectable()
export class ProjectFacadeRepositoryService {
  constructor(
    private projectRepositoryService: ProjectRepositoryService,
    private projectInfoRepositoryService: ProjectInfoRepositoryService,
    private authenticationRepositoryService: AuthenticationSettingRepositoryService,
    private browserRepositoryService: BrowserSettingRepositoryService,
    private applicationRepositoryService: ApplicationSettingRepositoryService,
    private recordingRepositoryService: RecordingRepositoryService,
    private specRepositoryService: SpecRepositoryService
  ) {}

  async createProject(projectSlug: string, settings: Partial<ProjectInfoDto>) {
    const initializedProjectInfo: CreateProjectInfoDto = {
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

    const recording: CreateRecordingDto = {
      title: 'page_view',
      steps: []
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

    await this.projectRepositoryService.create({ projectSlug });
    await this.projectInfoRepositoryService.create(initializedProjectInfo);
    await this.applicationRepositoryService.create(applicationSetting);
    await this.authenticationRepositoryService.create(authenticationSetting);
    await this.browserRepositoryService.create(browserSetting);
    await this.recordingRepositoryService.create(recording);
    await this.specRepositoryService.create(spec);
  }
}

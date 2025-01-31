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
  CreateProjectDto
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

  async createProject(project: CreateProjectDto) {
    const projectDto = await this.projectRepositoryService.create(project);
    const projectEntity = await this.projectRepositoryService.getEntityBySlug(
      project.projectSlug
    );

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
      }
    };

    const applicationPromise = this.applicationRepositoryService.create(
      projectEntity,
      applicationSetting
    );
    const authenticationPromise = this.authenticationRepositoryService.create(
      projectEntity,
      authenticationSetting
    );
    const browserPromise = this.browserRepositoryService.create(
      projectEntity,
      browserSetting
    );

    await Promise.all([
      applicationPromise,
      authenticationPromise,
      browserPromise
    ]);

    return projectDto;
  }
}

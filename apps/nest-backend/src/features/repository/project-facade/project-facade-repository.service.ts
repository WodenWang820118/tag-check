import { Injectable, Logger } from '@nestjs/common';
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
import {
  ApplicationSetting,
  AuthenticationSetting,
  BrowserSetting,
  ProjectSetting,
  Spec
} from '@utils';

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

  async updateProjectSettings(
    projectSlug: string,
    settings: Partial<ProjectSetting>
  ) {
    const projectEntity =
      await this.projectRepositoryService.getEntityBySlug(projectSlug);
    // Handle project settings update
    return await this.projectRepositoryService.update(
      projectEntity.id,
      settings
    );
  }

  async updateApplicationSettings(
    projectSlug: string,
    settings: Partial<ApplicationSetting>
  ) {
    const projectEntity =
      await this.projectRepositoryService.getEntityBySlug(projectSlug);
    // Handle application settings update
    return await this.applicationRepositoryService.update(
      projectEntity,
      settings
    );
  }

  async updateAuthenticationSettings(
    projectSlug: string,
    settings: Partial<AuthenticationSetting>
  ) {
    Logger.log('authentication settings: ', settings);
    const projectEntity =
      await this.projectRepositoryService.getEntityBySlug(projectSlug);
    Logger.log('projectEntity: ', JSON.stringify(projectEntity, null, 2));
    // Handle authentication settings update
    return await this.authenticationRepositoryService.update(
      projectEntity,
      settings
    );
  }

  async updateBrowserSettings(
    projectSlug: string,
    settings: Partial<BrowserSetting>
  ) {
    const projectEntity =
      await this.projectRepositoryService.getEntityBySlug(projectSlug);
    // Handle browser settings update
    return await this.browserRepositoryService.update(projectEntity, settings);
  }

  async updateSpec(projectSlug: string, eventId: string, spec: Spec) {
    return await this.specRepositoryService.update(projectSlug, eventId, spec);
  }
}

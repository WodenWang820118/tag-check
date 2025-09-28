import { Injectable, Logger } from '@nestjs/common';
import { ProjectRepositoryService } from '../../../core/repository/project/project-repository.service';
import { AuthenticationSettingRepositoryService } from '../../../core/repository/settings/authentication-setting-repository.service';
import { BrowserSettingRepositoryService } from '../../../core/repository/settings/browser-setting-repository.service';
import { ApplicationSettingRepositoryService } from '../../../core/repository/settings/application-setting-repository.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';
import {
  CreateApplicationSettingDto,
  CreateAuthenticationSettingDto,
  CreateBrowserSettingDto,
  CreateProjectDto,
  UpdateSpecDto
} from '../../../shared';
import {
  ApplicationSetting,
  AuthenticationSetting,
  BrowserSetting,
  ProjectSetting
} from '@utils';

@Injectable()
export class ProjectFacadeRepositoryService {
  private readonly logger = new Logger(ProjectFacadeRepositoryService.name);
  constructor(
    private readonly projectRepositoryService: ProjectRepositoryService,
    private readonly authenticationRepositoryService: AuthenticationSettingRepositoryService,
    private readonly browserRepositoryService: BrowserSettingRepositoryService,
    private readonly applicationRepositoryService: ApplicationSettingRepositoryService,
    private readonly specRepositoryService: SpecRepositoryService
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
      },
      websiteUrl: ''
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
    if (!settings) {
      throw new Error('Invalid settings');
    }

    if (!projectSlug) {
      throw new Error('Invalid projectSlug');
    }

    const projectEntity =
      await this.projectRepositoryService.getEntityBySlug(projectSlug);

    if (!projectEntity) {
      throw new Error('Project not found');
    }
    this.logger.debug(
      `updateApplicationSettings - projectSlug=${projectSlug}, entity=${JSON.stringify(projectEntity, null, 2)}`
    );
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
    Logger.log('projectEntity: ', JSON.stringify(projectEntity, null, 2));
    // Handle browser settings update
    return await this.browserRepositoryService.update(projectEntity, settings);
  }

  async updateSpec(projectSlug: string, eventId: string, spec: UpdateSpecDto) {
    return await this.specRepositoryService.update(projectSlug, eventId, spec);
  }
}

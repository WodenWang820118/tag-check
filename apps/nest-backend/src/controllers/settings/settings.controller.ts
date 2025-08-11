import { Controller, Get, Param, Put, Body, Logger } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ProjectSettingService } from '../../features/project-agent/project-setting/project-setting.service';
import {
  ApplicationSetting,
  ApplicationSettingSchema,
  AuthenticationSchema,
  AuthenticationSetting,
  BrowserSetting,
  BrowserSettingSchema,
  ProjectSetting
} from '@utils';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import { ProjectFacadeRepositoryService } from '../../features/repository/project-facade/project-facade-repository.service';

@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);
  constructor(
    private projectSettingService: ProjectSettingService,
    private projectRepositoryService: ProjectRepositoryService,
    private projectFacadeRepositoryService: ProjectFacadeRepositoryService
  ) {}

  @ApiOperation({
    summary: 'get project settings',
    description:
      'Get all settings for a project. The project is identified by the projectSlug.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @Get(':projectSlug')
  @Log()
  async getProjectSettings(@Param('projectSlug') projectSlug: string) {
    return await this.projectRepositoryService.getSettingBySlug(projectSlug);
  }

  @Put(':projectSlug/project')
  @Log()
  async updateProjectSettings(
    @Param('projectSlug') projectSlug: string,
    @Body() settings: Partial<ProjectSetting>
  ) {
    this.logger.log(
      `updateProjectSettings - projectSlug=${projectSlug}, settings=${JSON.stringify(settings)}`
    );
    return await this.projectFacadeRepositoryService.updateProjectSettings(
      projectSlug,
      settings
    );
  }

  @Put(':projectSlug/application')
  @Log()
  async updateApplicationSettings(
    @Param('projectSlug') projectSlug: string,
    @Body() settings: Partial<ApplicationSetting>
  ) {
    this.logger.log(
      `updateApplicationSettings - projectSlug=${projectSlug}, settings=${JSON.stringify(settings)}`
    );
    return await this.projectFacadeRepositoryService.updateApplicationSettings(
      projectSlug,
      settings
    );
  }

  @Put(':projectSlug/authentication')
  @Log()
  async updateAuthenticationSettings(
    @Param('projectSlug') projectSlug: string,
    @Body() settings: Partial<AuthenticationSetting>
  ) {
    this.logger.log(
      `updateAuthenticationSettings - projectSlug=${projectSlug}, settings=${JSON.stringify(settings)}`
    );
    return await this.projectFacadeRepositoryService.updateAuthenticationSettings(
      projectSlug,
      settings
    );
  }

  @Put(':projectSlug/browser')
  @Log()
  async updateBrowserSettings(
    @Param('projectSlug') projectSlug: string,
    @Body() settings: Partial<BrowserSetting>
  ) {
    this.logger.log(
      `updateBrowserSettings - projectSlug=${projectSlug}, settings=${JSON.stringify(settings)}`
    );
    return await this.projectFacadeRepositoryService.updateBrowserSettings(
      projectSlug,
      settings
    );
  }
}

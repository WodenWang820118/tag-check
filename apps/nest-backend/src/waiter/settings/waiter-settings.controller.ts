import { Controller, Get, Param, Put, Body, Logger } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ProjectSettingService } from '../../project-agent/project-setting/project-setting.service';
import { Setting } from '@utils';

@Controller('settings')
export class WaiterSettingsController {
  constructor(private projectSettingService: ProjectSettingService) {}

  @ApiOperation({
    summary: 'get project settings',
    description:
      'Get all settings for a project. The project is identified by the projectSlug.',
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.',
  })
  @Get(':projectSlug')
  async getProjectSettings(@Param('projectSlug') projectSlug: string) {
    return await this.projectSettingService.getProjectSettings(projectSlug);
  }

  @ApiOperation({
    summary: 'update project settings',
    description:
      'Update all settings for a project. The project is identified by the projectSlug.',
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiParam({
    name: 'section',
    description:
      'The section of the settings to update. E.g. application, user, etc.',
  })
  @ApiBody({
    description: 'The settings to update.',
    type: Object,
  })
  @Put(':projectSlug/sections/:section')
  async updateProjectSettings(
    @Param('projectSlug') projectSlug: string,
    @Param('section') section: string,
    @Body() settings: Partial<Setting>
  ) {
    const updatedSettings =
      await this.projectSettingService.updateProjectSettings(
        projectSlug,
        section,
        settings
      );
    return {
      projectSlug: projectSlug,
      settings: updatedSettings,
    };
  }
}

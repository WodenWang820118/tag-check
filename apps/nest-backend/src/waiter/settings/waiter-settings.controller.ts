import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Post,
  Logger,
} from '@nestjs/common';
import { WaiterSettingsService } from './waiter-settings.service';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('settings')
export class WaiterSettingsController {
  constructor(private waiterSettingsService: WaiterSettingsService) {}

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
    return await this.waiterSettingsService.getProjectSettings(projectSlug);
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
    @Body() settings: any
  ) {
    return await this.waiterSettingsService.updateProjectSettings(
      projectSlug,
      section,
      settings
    );
  }

  @Post(':projectSlug')
  @ApiOperation({
    summary: 'create project settings',
    description:
      'Create settings for a project. The project is identified by the projectSlug.',
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiBody({
    description: 'The settings to create.',
    type: Object,
  })
  async createProjectSettings(
    @Param('projectSlug') projectSlug: string,
    @Body() settings: any
  ) {
    return await this.waiterSettingsService.createProjectSettings(
      projectSlug,
      settings
    );
  }
}

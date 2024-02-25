import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { WaiterConfigurationService } from './waiter-configuration.service';

@Controller('configurations')
export class WaiterConfigurationController {
  constructor(private waiterConfigurationService: WaiterConfigurationService) {}

  @Get()
  async getConfigurations() {
    return await this.waiterConfigurationService.getConfigurations();
  }

  @Get(':name')
  async getConfiguration(@Param('name') name: string) {
    return await this.waiterConfigurationService.getConfiguration(name);
  }

  @Delete('reset/:name')
  async resetConfiguration(@Param('name') name: string) {
    return await this.waiterConfigurationService.resetConfiguration(name);
  }

  @Post('create')
  async createConfiguration(
    @Body() configuration: { name: string; value: string }
  ) {
    return await this.waiterConfigurationService.createConfiguration(
      configuration.name,
      configuration.value
    );
  }
}

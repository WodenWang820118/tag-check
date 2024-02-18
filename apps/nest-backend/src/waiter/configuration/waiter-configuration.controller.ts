import { Controller, Get, Param } from '@nestjs/common';
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
}

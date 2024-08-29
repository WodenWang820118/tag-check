import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
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
    try {
      const result = await this.waiterConfigurationService.getConfiguration(
        name
      );
      console.log(`Result:`, result);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Handle other types of errors
      throw new InternalServerErrorException(
        'An error occurred while fetching the configuration'
      );
    }
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

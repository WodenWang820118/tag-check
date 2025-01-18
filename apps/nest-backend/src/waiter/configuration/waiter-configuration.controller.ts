import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post
} from '@nestjs/common';
import { WaiterConfigurationService } from './waiter-configuration.service';
import { Log } from '../../logging-interceptor/logging-interceptor.service';

@Controller('configurations')
export class WaiterConfigurationController {
  constructor(private waiterConfigurationService: WaiterConfigurationService) {}

  @Get('/debug')
  @Log()
  getError() {
    throw new Error('My first Sentry error!');
  }

  @Get()
  @Log()
  async getConfigurations() {
    return await this.waiterConfigurationService.getConfigurations();
  }

  @Get(':name')
  @Log()
  async getConfiguration(@Param('name') name: string) {
    try {
      const result =
        await this.waiterConfigurationService.getConfiguration(name);
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

  @Post('create')
  createConfiguration(@Body() configuration: { name: string; value: string }) {
    return this.waiterConfigurationService.createConfiguration(
      configuration.name,
      configuration.value
    );
  }
}

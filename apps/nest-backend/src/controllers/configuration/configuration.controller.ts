import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post
} from '@nestjs/common';
import { ConfigurationControllerService } from './configuration-controller.service';
@Controller('configurations')
export class ConfigurationController {
  constructor(private readonly service: ConfigurationControllerService) {}

  @Get('/debug')
  getError() {
    throw new Error('My first Sentry error!');
  }

  @Get()
  async getConfigurations() {
    return await this.service.getConfigurations();
  }

  @Get(':name')
  async getConfiguration(@Param('name') name: string) {
    try {
      const result = await this.service.getConfiguration(name);
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
    return this.service.createConfiguration(
      configuration.name,
      configuration.value
    );
  }
}

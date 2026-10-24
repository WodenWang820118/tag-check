import {
  Body,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Param,
  Post
} from '@nestjs/common';
import { ConfigurationControllerService } from './configuration-controller.service';

/** Reads and creates the backend's system configuration entries. */
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

  /**
   * The value of one configuration entry, as `{ value }`.
   *
   * @throws 404 when no entry has this name; 500 for any other failure.
   */
  @Get(':name')
  async getConfiguration(@Param('name') name: string) {
    try {
      return await this.service.getConfiguration(name);
    } catch (error) {
      // The repository reports a missing entry as an HttpException 404,
      // not a NotFoundException: keep its status.
      if (error instanceof HttpException) {
        throw error;
      }
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

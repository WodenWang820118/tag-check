/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigurationService } from '../../core/configuration/configuration.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConfigurationControllerService {
  private readonly logger = new Logger(ConfigurationControllerService.name);
  constructor(private configurationService: ConfigurationService) {}
  async getConfigurations() {
    return await this.configurationService.findAll();
  }

  async getConfiguration(name: string) {
    const configuration = await this.configurationService.findOneByName(name);
    if (!configuration) {
      throw new NotFoundException(`Configuration '${name}' not found`);
    }
    const value = configuration.value;
    this.logger.log(`Configuration value: ${value}`);
    return { value };
  }

  createConfiguration(name: string, value: string) {
    return this.configurationService.create({
      id: uuidv4(),
      title: name,
      description: '',
      value: value,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

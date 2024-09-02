/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigurationService } from '../../configuration/configuration.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WaiterConfigurationService {
  constructor(private configurationService: ConfigurationService) {}
  async getConfigurations() {
    return await this.configurationService.findAll();
  }

  async getConfiguration(name: string) {
    const configuration = await this.configurationService.findOneByName(name);
    if (!configuration) {
      throw new NotFoundException(`Configuration '${name}' not found`);
    }
    const value = configuration.getDataValue('value');
    Logger.log(
      `Configuration value: ${value}`,
      `${WaiterConfigurationService.name}.${this.getConfiguration.name}`
    );
    return { value };
  }

  async resetConfiguration(name: string) {
    return await this.configurationService.removeByName(name);
  }

  async createConfiguration(name: string, value: string) {
    return await this.configurationService.create({
      id: uuidv4(),
      title: name,
      description: '',
      value: value,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

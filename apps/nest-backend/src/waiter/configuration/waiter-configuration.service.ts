import { Injectable } from '@nestjs/common';
import { ConfigurationService } from '../../configuration/configuration.service';

@Injectable()
export class WaiterConfigurationService {
  constructor(private configurationService: ConfigurationService) {}
  async getConfigurations() {
    return await this.configurationService.findAll();
  }

  async getConfiguration(name: string) {
    const value = (await this.configurationService.findAll()).find(
      (item) => item.title === name
    )?.value;
    return { value } || {}; // Wrap the value in an object
  }

  async resetConfiguration(name: string) {
    return await this.configurationService.removeByName(name);
  }

  async createConfiguration(name: string, value: string) {
    return await this.configurationService.create({
      title: name,
      description: '',
      value: value,
    });
  }
}

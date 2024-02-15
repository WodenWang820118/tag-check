import { Injectable } from '@nestjs/common';
import { ConfigurationService } from '../../configuration/configuration.service';

@Injectable()
export class WaiterConfigurationService {
  constructor(private configurationService: ConfigurationService) {}
  async getConfigurations() {
    return await this.configurationService.findAll();
  }

  async getConfiguration(name: string) {
    return (await this.configurationService.findAll()).find(
      (item) => item.title === name
    ).value;
  }
}

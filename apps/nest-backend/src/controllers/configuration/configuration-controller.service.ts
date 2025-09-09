 
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SysConfigurationRepositoryService } from '../../core/repository/sys-configuration/sys-configuration-repository.service';

@Injectable()
export class ConfigurationControllerService {
  private readonly logger = new Logger(ConfigurationControllerService.name);
  constructor(
    private readonly configurationService: SysConfigurationRepositoryService
  ) {}
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
      name: name,
      value: value
    });
  }
}

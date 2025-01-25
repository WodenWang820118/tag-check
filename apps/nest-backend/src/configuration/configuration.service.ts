/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { Configuration } from './entities/configuration.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigsService } from '../configs/configs.service';
import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { existsSync } from 'fs';

@Injectable()
export class ConfigurationService implements OnModuleInit {
  private logger = new Logger(ConfigurationService.name);
  constructor(
    @InjectRepository(Configuration)
    private readonly configurationRepository: Repository<Configuration>,
    private readonly configsService: ConfigsService
  ) {}

  async onModuleInit() {
    await this.checkIfRootProjectPathExists();
  }

  async checkIfRootProjectPathExists() {
    try {
      const rootPath = await this.configurationRepository.findOne({
        where: { title: this.configsService.getCONFIG_ROOT_PATH() }
      });

      if (!rootPath || !existsSync(rootPath.value)) {
        // Create new configuration entity
        const newRootPath = this.configurationRepository.create({
          title: this.configsService.getCONFIG_ROOT_PATH(),
          value: this.configsService.getROOT_PROJECT_PATH(),
          description: 'Root path configuration' // Add meaningful description
        });

        // Save the entity
        const savedConfig =
          await this.configurationRepository.save(newRootPath);

        this.logger.log(
          'Created new root path configuration:',
          JSON.stringify(savedConfig, null, 2)
        );
      } else {
        this.logger.log('Valid root path configuration found');
      }
    } catch (error) {
      this.logger.error('Failed to initialize configuration:', error);
      throw error; // Re-throw to prevent application from starting with invalid config
    }
  }

  create(createConfigurationDto: CreateConfigurationDto): Configuration {
    return this.configurationRepository.create(createConfigurationDto);
  }

  async findAll() {
    return await this.configurationRepository.find();
  }

  async findOne(id: string) {
    return await this.configurationRepository.findOne({ where: { id: id } });
  }

  async findOneByName(name: string) {
    return await this.configurationRepository.findOne({
      where: { title: name }
    });
  }

  async update(id: string, updateConfigurationDto: UpdateConfigurationDto) {
    return await this.configurationRepository.update(
      { value: updateConfigurationDto.value },
      { id: id }
    );
  }

  async remove(id: string) {
    return await this.configurationRepository.delete({ id });
  }

  async getRootProjectPath(): Promise<string> {
    return await this.configurationRepository
      .findOne({
        where: { title: this.configsService.getCONFIG_ROOT_PATH() }
      })
      .then((res) => {
        return res?.value;
      })
      .catch((err) => {
        return err;
      });
  }

  async getCurrentProjectPath(): Promise<string> {
    return await this.configurationRepository
      .findOne({
        where: { title: this.configsService.getCONFIG_CURRENT_PROJECT_PATH() }
      })
      .then((res) => {
        return res?.value;
      })
      .catch((err) => {
        return err;
      });
  }
}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  SysConfigurationEntity,
  CreateSysConfigurationDto,
  UpdateSysConfigurationDto
} from '../../../shared';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigsService } from '../../configs/configs.service';
import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { existsSync } from 'fs';

@Injectable()
export class SysConfigurationRepositoryService {
  private logger = new Logger(SysConfigurationRepositoryService.name);
  constructor(
    @InjectRepository(SysConfigurationEntity)
    private readonly configurationRepository: Repository<SysConfigurationEntity>,
    private readonly configsService: ConfigsService
  ) {
    void this.checkIfRootProjectPathExists();
  }

  async checkIfRootProjectPathExists() {
    try {
      const configName = this.configsService.getCONFIG_ROOT_PATH();
      const configValue = this.configsService.getROOT_PROJECT_PATH();

      // Try to find existing configuration
      const rootPath = await this.configurationRepository.findOne({
        where: { name: configName }
      });

      if (!rootPath) {
        // Use insert or update (upsert) to handle potential race conditions
        await this.configurationRepository
          .createQueryBuilder()
          .insert()
          .into(SysConfigurationEntity)
          .values({
            name: configName,
            value: configValue,
            description: 'Root path configuration'
          })
          .orUpdate(['value', 'description'], ['name'])
          .execute();

        this.logger.log('Root path configuration created or updated');
      } else if (!existsSync(rootPath.value)) {
        // Path doesn't exist, update it
        rootPath.value = configValue;
        await this.configurationRepository.save(rootPath);
        this.logger.log('Updated root path configuration with valid path');
      } else {
        this.logger.log('Valid root path configuration found');
      }
    } catch (error) {
      this.logger.error('Failed to initialize configuration:', error);
      throw error;
    }
  }

  create(
    createConfigurationDto: CreateSysConfigurationDto
  ): SysConfigurationEntity {
    return this.configurationRepository.create(createConfigurationDto);
  }

  async findAll() {
    return await this.configurationRepository.find();
  }

  async findOne(id: number) {
    const configuration = await this.configurationRepository.findOne({
      where: { id: id }
    });

    if (!configuration) {
      throw new HttpException(
        `Configuration with ID ${id} not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return configuration;
  }

  async findOneByName(name: string) {
    const configuration = await this.configurationRepository.findOne({
      where: { name: name }
    });

    if (!configuration) {
      throw new HttpException(
        `Configuration with name ${name} not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return configuration;
  }

  async update(id: number, updateConfigurationDto: UpdateSysConfigurationDto) {
    return await this.configurationRepository.update(
      { value: updateConfigurationDto.value },
      { id: id }
    );
  }

  async remove(id: number) {
    return await this.configurationRepository.delete({ id });
  }

  async getRootProjectPath() {
    const configuration = await this.configurationRepository.findOne({
      where: { name: this.configsService.getCONFIG_ROOT_PATH() }
    });

    if (!configuration) {
      throw new HttpException(
        'Root project path configuration not found',
        HttpStatus.NOT_FOUND
      );
    }

    return configuration.value;
  }

  async getCurrentProjectPath() {
    const configuration = await this.configurationRepository.findOne({
      where: { name: this.configsService.getCONFIG_CURRENT_PROJECT_PATH() }
    });

    if (!configuration) {
      throw new HttpException(
        'Current project path configuration not found',
        HttpStatus.NOT_FOUND
      );
    }

    return configuration;
  }
}

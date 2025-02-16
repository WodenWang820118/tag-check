import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit
} from '@nestjs/common';
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
export class SysConfigurationRepositoryService implements OnModuleInit {
  private logger = new Logger(SysConfigurationRepositoryService.name);
  constructor(
    @InjectRepository(SysConfigurationEntity)
    private readonly configurationRepository: Repository<SysConfigurationEntity>,
    private readonly configsService: ConfigsService
  ) {}

  async onModuleInit() {
    await this.checkIfRootProjectPathExists();
  }

  async checkIfRootProjectPathExists() {
    try {
      const rootPath = await this.configurationRepository.findOne({
        where: { name: this.configsService.getCONFIG_ROOT_PATH() }
      });

      if (!rootPath || !existsSync(rootPath.value)) {
        // Create new configuration entity
        const newRootPath = this.configurationRepository.create({
          name: this.configsService.getCONFIG_ROOT_PATH(),
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

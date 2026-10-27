import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit
} from '@nestjs/common';
import {
  SysConfigurationEntity,
  CreateSysConfigurationDto
} from '../../../shared';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigsService } from '../../configs/configs.service';
import { Repository } from 'typeorm';
import { existsSync } from 'fs';

/**
 * Reads and writes system configuration entries, such as the root projects
 * path, which it creates or repairs when the module starts.
 */
@Injectable()
export class SysConfigurationRepositoryService implements OnModuleInit {
  private readonly logger = new Logger(SysConfigurationRepositoryService.name);
  constructor(
    @InjectRepository(SysConfigurationEntity)
    private readonly configurationRepository: Repository<SysConfigurationEntity>,
    private readonly configsService: ConfigsService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.checkIfRootProjectPathExists();
  }

  async checkIfRootProjectPathExists() {
    try {
      const configName = this.configsService.getCONFIG_ROOT_PATH();
      const configValue = this.configsService.getROOT_PROJECT_PATH();

      // Try to find existing configuration
      const rootPath = await this.configurationRepository.findOne({
        where: { name: configName }
      });

      if (rootPath) {
        if (existsSync(rootPath.value)) {
          this.logger.log('Valid root path configuration found');
        } else {
          // Path doesn't exist, update it
          rootPath.value = configValue;
          await this.configurationRepository.save(rootPath);
          this.logger.log('Updated root path configuration with valid path');
        }
      } else {
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
      }
    } catch (error) {
      this.logger.error('Failed to initialize configuration:', error);
      throw error;
    }
  }

  /** Saves a new entry. Rejects when an entry already has its name. */
  async create(
    createConfigurationDto: CreateSysConfigurationDto
  ): Promise<SysConfigurationEntity> {
    return await this.configurationRepository.save(
      this.configurationRepository.create(createConfigurationDto)
    );
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

  /** The value of the entry named `name`, or null when there is none. */
  async getValue(name: string): Promise<string | null> {
    const configuration = await this.configurationRepository.findOne({
      where: { name }
    });
    return configuration?.value ?? null;
  }

  /** Creates the entry named `name`, or replaces its value. */
  async setValue(
    name: string,
    value: string,
    description: string
  ): Promise<void> {
    await this.configurationRepository
      .createQueryBuilder()
      .insert()
      .into(SysConfigurationEntity)
      .values({ name, value, description })
      .orUpdate(['value', 'description'], ['name'])
      .execute();
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
}

import { existsSync } from 'fs';
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { Configuration } from './entities/configuration.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'sequelize-typescript';
import { ConfigsService } from '../configs/configs.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class ConfigurationService implements OnModuleInit {
  private logger = new Logger(ConfigurationService.name);
  constructor(
    @InjectRepository(Configuration)
    private readonly configurationRepository: Repository<Configuration>,
    private readonly configsService: ConfigsService
  ) {}

  async onModuleInit() {
    const rootPath = await this.configurationRepository.findOne({
      where: { title: this.configsService.getCONFIG_ROOT_PATH() },
    });
    this.logger.log(rootPath);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (!rootPath || !existsSync(rootPath.getDataValue('value'))) {
      const newRootPath = await this.create({
        title: this.configsService.getCONFIG_ROOT_PATH(),
        value: this.configsService.getROOT_PROJECT_PATH(),
        id: '',
        description: '',
      });
      this.logger.log('Created new root path configuration:', newRootPath);
    } else {
      this.logger.log('Valid root path configuration found');
    }
  }

  async create(
    createConfigurationDto: CreateConfigurationDto
  ): Promise<Configuration> {
    return await this.configurationRepository.create(
      createConfigurationDto as any
    );
  }

  async findAll() {
    return await this.configurationRepository.findAll();
  }

  async findOne(id: string) {
    return await this.configurationRepository.findOne({ where: { id: id } });
  }

  async findOneByName(name: string) {
    return await this.configurationRepository.findOne({
      where: { title: name },
    });
  }

  async update(id: string, updateConfigurationDto: UpdateConfigurationDto) {
    return await this.configurationRepository.update(
      { value: updateConfigurationDto.value },
      { where: { id: id } }
    );
  }

  async remove(id: string) {
    return await this.configurationRepository.destroy({ where: { id: id } });
  }

  async removeByName(name: string) {
    return await this.configurationRepository.destroy({
      where: { title: name },
    });
  }

  async getRootProjectPath(): Promise<string> {
    return await this.configurationRepository
      .findOne({
        where: { title: this.configsService.getCONFIG_ROOT_PATH() },
      })
      .then((res) => {
        return res?.getDataValue('value');
      })
      .catch((err) => {
        return err;
      });
  }

  async getCurrentProjectPath(): Promise<string> {
    return await this.configurationRepository
      .findOne({
        where: { title: this.configsService.getCONFIG_CURRENT_PROJECT_PATH() },
      })
      .then((res) => {
        return res?.getDataValue('value');
      })
      .catch((err) => {
        return err;
      });
  }
}

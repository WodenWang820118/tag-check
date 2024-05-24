import { Injectable } from '@nestjs/common';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { Configuration } from './entities/configuration.entity';
import { InjectModel } from '@nestjs/sequelize';
import {
  CONFIG_CURRENT_PROJECT_PATH,
  CONFIG_ROOT_PATH,
} from '../configs/project.config';

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectModel(Configuration)
    private configurationRepository: typeof Configuration
  ) {}

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
        where: { title: CONFIG_ROOT_PATH },
      })
      .then((res) => {
        return res.getDataValue('value');
      });
  }

  async getCurrentProjectPath(): Promise<string> {
    return await this.configurationRepository
      .findOne({
        where: { title: CONFIG_CURRENT_PROJECT_PATH },
      })
      .then((res) => {
        return res.getDataValue('value');
      });
  }
}

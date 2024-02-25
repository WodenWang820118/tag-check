import { Injectable, Logger } from '@nestjs/common';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { Configuration } from './entities/configuration.entity';
import { InjectModel } from '@nestjs/sequelize';

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

  async findOne(id: number) {
    return await this.configurationRepository.findOne({ where: { id: id } });
  }

  async update(id: number, updateConfigurationDto: UpdateConfigurationDto) {
    return await this.configurationRepository.update(
      { value: updateConfigurationDto.value },
      { where: { id: id } }
    );
  }

  async remove(id: number) {
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
        where: { title: 'rootProjectPath' },
      })
      .then((res) => {
        return res.getDataValue('value');
      });
  }

  async getCurrentProjectPath(): Promise<string> {
    return await this.configurationRepository
      .findOne({
        where: { title: 'currentProjectPath' },
      })
      .then((res) => {
        return res.getDataValue('value');
      });
  }
}

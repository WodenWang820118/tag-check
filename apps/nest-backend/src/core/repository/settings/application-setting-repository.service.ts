import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApplicationSettingEntity,
  ApplicationSettingResponseDto,
  CreateApplicationSettingDto,
  ProjectEntity,
  UpdateApplicationSettingDto
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ApplicationSettingRepositoryService {
  constructor(
    @InjectRepository(ApplicationSettingEntity)
    private readonly repository: Repository<ApplicationSettingEntity>
  ) {}

  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(ApplicationSettingResponseDto, entity);
  }

  async create(
    projectEntity: ProjectEntity,
    data: CreateApplicationSettingDto
  ) {
    const applicationSetting = new ApplicationSettingEntity();
    applicationSetting.project = projectEntity;
    applicationSetting.localStorage = data.localStorage;
    applicationSetting.cookie = data.cookie;
    applicationSetting.gtm = data.gtm;
    const entity = await this.repository.save(applicationSetting);
    return plainToInstance(ApplicationSettingResponseDto, entity);
  }

  async update(
    projectEntity: ProjectEntity,
    data: UpdateApplicationSettingDto
  ) {
    try {
      // First, find existing setting for the project
      const existingSetting = await this.repository.findOne({
        where: {
          project: { id: projectEntity.id } // Assuming project has an id field
        }
      });

      if (existingSetting) {
        // Update existing setting
        const updatedSetting = await this.repository.save({
          ...existingSetting,
          ...data,
          project: projectEntity
        });

        return plainToInstance(ApplicationSettingResponseDto, updatedSetting);
      }

      throw new HttpException(
        'Application settings not found',
        HttpStatus.NOT_FOUND
      );
    } catch (error) {
      Logger.error(`Failed to update Application settings: ${error}`);
      throw new HttpException(
        'Failed to update Application settings',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

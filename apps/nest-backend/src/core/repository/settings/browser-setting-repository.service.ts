import { ProjectEntity } from './../../../shared/entity/project.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BrowserSettingEntity,
  BrowserSettingResponseDto,
  CreateBrowserSettingDto,
  UpdateBrowserSettingDto
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class BrowserSettingRepositoryService {
  constructor(
    @InjectRepository(BrowserSettingEntity)
    private readonly repository: Repository<BrowserSettingEntity>
  ) {}

  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(BrowserSettingResponseDto, entity);
  }

  async create(projectEntity: ProjectEntity, data: CreateBrowserSettingDto) {
    const browserSetting = new BrowserSettingEntity();
    browserSetting.browser = data.browser;
    browserSetting.headless = data.headless;
    browserSetting.project = projectEntity;
    const entity = await this.repository.save(browserSetting);
    return plainToInstance(BrowserSettingResponseDto, entity);
  }

  async update(projectEntity: ProjectEntity, data: UpdateBrowserSettingDto) {
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

        return plainToInstance(BrowserSettingResponseDto, updatedSetting);
      }

      throw new HttpException(
        'Browser settings not found',
        HttpStatus.NOT_FOUND
      );
    } catch (error) {
      Logger.error(`Failed to update Browser settings: ${error}`);
      throw new HttpException(
        'Failed to update Browser settings',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

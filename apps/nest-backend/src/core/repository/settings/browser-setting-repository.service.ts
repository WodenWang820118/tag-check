import { ProjectEntity } from './../../../shared/entity/project.entity';
import { Injectable } from '@nestjs/common';
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

  async update(id: number, data: UpdateBrowserSettingDto) {
    const entity = await this.repository.update(id, data);
    return plainToInstance(BrowserSettingResponseDto, entity);
  }
}

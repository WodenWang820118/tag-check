import { Injectable } from '@nestjs/common';
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

  async update(id: number, data: UpdateApplicationSettingDto) {
    const entity = await this.repository.update(id, data);
    return plainToInstance(ApplicationSettingResponseDto, entity);
  }
}

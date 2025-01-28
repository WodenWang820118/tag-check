import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApplicationSettingEntity,
  CreateApplicationSettingDto,
  UpdateApplicationSettingDto
} from '../../../shared';

@Injectable()
export class ApplicationSettingRepositoryService {
  constructor(
    @InjectRepository(ApplicationSettingEntity)
    private readonly repository: Repository<ApplicationSettingEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: CreateApplicationSettingDto) {
    return this.repository.save(data);
  }

  async update(id: number, data: UpdateApplicationSettingDto) {
    return this.repository.update(id, data);
  }
}

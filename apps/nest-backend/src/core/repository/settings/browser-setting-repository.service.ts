import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BrowserSettingEntity,
  CreateBrowserSettingDto,
  UpdateBrowserSettingDto
} from '../../../shared';

@Injectable()
export class BrowserSettingRepositoryService {
  constructor(
    @InjectRepository(BrowserSettingEntity)
    private readonly repository: Repository<BrowserSettingEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: CreateBrowserSettingDto) {
    return this.repository.save(data);
  }

  async update(id: number, data: UpdateBrowserSettingDto) {
    return this.repository.update(id, data);
  }
}

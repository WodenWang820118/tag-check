import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrowserSettingEntity } from '../../../shared';

@Injectable()
export class BrowserSettingRepositoryService {
  constructor(
    @InjectRepository(BrowserSettingEntity)
    private readonly repository: Repository<BrowserSettingEntity>
  ) {}
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationSettingEntity } from '../../../shared';

@Injectable()
export class ApplicationSettingRepositoryService {
  constructor(
    @InjectRepository(ApplicationSettingEntity)
    private readonly repository: Repository<ApplicationSettingEntity>
  ) {}
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticationSettingEntity } from '../../../shared';

@Injectable()
export class AuthenticationSettingRepositoryService {
  constructor(
    @InjectRepository(AuthenticationSettingEntity)
    private readonly repository: Repository<AuthenticationSettingEntity>
  ) {}
}

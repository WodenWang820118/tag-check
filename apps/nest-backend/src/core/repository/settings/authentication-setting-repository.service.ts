import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuthenticationSettingEntity,
  CreateAuthenticationSettingDto,
  UpdateAuthenticationSettingDto
} from '../../../shared';

@Injectable()
export class AuthenticationSettingRepositoryService {
  constructor(
    @InjectRepository(AuthenticationSettingEntity)
    private readonly repository: Repository<AuthenticationSettingEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: CreateAuthenticationSettingDto) {
    return this.repository.save(data);
  }

  async update(id: number, data: UpdateAuthenticationSettingDto) {
    return this.repository.update(id, data);
  }
}

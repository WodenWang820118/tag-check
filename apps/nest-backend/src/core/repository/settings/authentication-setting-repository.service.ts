import { ProjectEntity } from './../../../shared/entity/project.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuthenticationSettingEntity,
  AuthenticationSettingResponseDto,
  CreateAuthenticationSettingDto,
  UpdateAuthenticationSettingDto
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AuthenticationSettingRepositoryService {
  constructor(
    @InjectRepository(AuthenticationSettingEntity)
    private readonly repository: Repository<AuthenticationSettingEntity>
  ) {}

  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(AuthenticationSettingResponseDto, entity);
  }

  async create(
    projectEntity: ProjectEntity,
    data: CreateAuthenticationSettingDto
  ) {
    const authenticationSetting = new AuthenticationSettingEntity();
    authenticationSetting.project = projectEntity;
    authenticationSetting.username = data.username;
    authenticationSetting.password = data.password;
    const entity = await this.repository.save(authenticationSetting);
    return plainToInstance(AuthenticationSettingResponseDto, entity);
  }

  async update(id: number, data: UpdateAuthenticationSettingDto) {
    const entity = await this.repository.update(id, data);
    return plainToInstance(AuthenticationSettingResponseDto, entity);
  }
}

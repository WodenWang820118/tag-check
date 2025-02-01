import { ProjectEntity } from './../../../shared/entity/project.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
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

  async update(
    projectEntity: ProjectEntity,
    data: UpdateAuthenticationSettingDto
  ) {
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

        return plainToInstance(
          AuthenticationSettingResponseDto,
          updatedSetting
        );
      }

      throw new HttpException(
        'Authentication settings not found',
        HttpStatus.NOT_FOUND
      );
    } catch (error) {
      Logger.error(`Failed to update authentication settings: ${error}`);
      throw new HttpException(
        'Failed to update authentication settings',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

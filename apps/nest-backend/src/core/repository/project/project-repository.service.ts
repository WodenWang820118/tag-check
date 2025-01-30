import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateProjectDto,
  ProjectEntity,
  ProjectResponseDto,
  UpdateProjectDto
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProjectRepositoryService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repository: Repository<ProjectEntity>
  ) {}

  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(ProjectResponseDto, entity);
  }

  async list() {
    const entity = await this.repository.find();
    return plainToInstance(ProjectResponseDto, entity);
  }

  async getBySlug(slug: string) {
    const entity = await this.repository.findOne({
      where: { projectSlug: slug }
    });
    return plainToInstance(ProjectResponseDto, entity);
  }

  async getSettingBySlug(slug: string) {
    const entity = await this.repository.findOne({
      relations: {
        authenticationSettings: true,
        browserSettings: true,
        applicationSettings: true
      },
      where: { projectSlug: slug }
    });

    return plainToInstance(ProjectResponseDto, entity);
  }

  async create(data: CreateProjectDto): Promise<ProjectResponseDto> {
    const entity = await this.repository.save(data);
    return plainToInstance(ProjectResponseDto, entity);
  }

  async update(id: number, data: UpdateProjectDto) {
    const entity = await this.repository.update(id, data);
    return plainToInstance(ProjectResponseDto, entity);
  }

  async deleteBySlug(slug: string) {
    const entity = await this.repository.delete({ projectSlug: slug });
    return plainToInstance(ProjectResponseDto, entity);
  }
}

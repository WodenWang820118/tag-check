import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateProjectDto,
  ProjectEntity,
  UpdateProjectDto
} from '../../../shared';

@Injectable()
export class ProjectRepositoryService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repository: Repository<ProjectEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async list() {
    return this.repository.find();
  }

  async getBySlug(slug: string) {
    return this.repository.findOne({ where: { projectSlug: slug } });
  }

  async getSettingBySlug(slug: string) {
    return this.repository.findOne({
      relations: {
        authenticationSettings: true,
        browserSettings: true,
        applicationSettings: true
      },
      where: { projectSlug: slug }
    });
  }

  async create(data: CreateProjectDto) {
    return this.repository.save(data);
  }

  async update(id: number, data: UpdateProjectDto) {
    return this.repository.update(id, data);
  }

  async deleteBySlug(slug: string) {
    return this.repository.delete({ projectSlug: slug });
  }
}

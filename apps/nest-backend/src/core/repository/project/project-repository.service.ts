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

  async create(data: CreateProjectDto) {
    return this.repository.save(data);
  }

  async update(id: number, data: UpdateProjectDto) {
    return this.repository.update(id, data);
  }
}

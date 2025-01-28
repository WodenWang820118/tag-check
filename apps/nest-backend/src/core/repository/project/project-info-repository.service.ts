import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProjectInfoEntity,
  CreateProjectInfoDto,
  UpdateProjectInfoDto
} from '../../../shared';

@Injectable()
export class ProjectInfoRepositoryService {
  constructor(
    @InjectRepository(ProjectInfoEntity)
    private readonly repository: Repository<ProjectInfoEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: CreateProjectInfoDto) {
    return this.repository.save(data);
  }

  async update(id: number, data: UpdateProjectInfoDto) {
    return this.repository.update(id, data);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectInfoEntity } from '../../../shared';

@Injectable()
export class ProjectInfoRepositoryService {
  constructor(
    @InjectRepository(ProjectInfoEntity)
    private readonly repository: Repository<ProjectInfoEntity>
  ) {}
}

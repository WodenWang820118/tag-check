import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity, ProjectInfoEntity } from '../../../shared';

import { ProjectInfoRepositoryService } from './project-info-repository.service';
import { ProjectRepositoryService } from './project-repository.service';

const modules = [TypeOrmModule.forFeature([ProjectInfoEntity, ProjectEntity])];

const services = [ProjectInfoRepositoryService, ProjectRepositoryService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class ProjectRepositoryModule {}

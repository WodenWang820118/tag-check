import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from '../../../shared';

import { ProjectRepositoryService } from './project-repository.service';

const modules = [TypeOrmModule.forFeature([ProjectEntity])];
const services = [ProjectRepositoryService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class ProjectRepositoryModule {}

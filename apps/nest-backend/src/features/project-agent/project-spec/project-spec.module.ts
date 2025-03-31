import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectSpecService } from './project-spec.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecEntity, ProjectEntity } from '../../../shared';
import { SpecService } from './spec.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';

const modules = [
  OsModule,
  TypeOrmModule.forFeature([ProjectEntity, SpecEntity])
];
const services = [ProjectSpecService, SpecService, SpecRepositoryService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class ProjectSpecModule {}

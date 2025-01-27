import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectSpecService } from './project-spec.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecEntity, ProjectEntity } from '../../../shared';
import { SpecService } from './spec.service';

@Module({
  imports: [OsModule, TypeOrmModule.forFeature([ProjectEntity, SpecEntity])],
  providers: [ProjectSpecService, SpecService],
  exports: [
    ProjectSpecService,
    SpecService,
    OsModule,
    TypeOrmModule.forFeature([ProjectEntity, SpecEntity])
  ]
})
export class ProjectSpecModule {}

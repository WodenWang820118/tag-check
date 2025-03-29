import { Module } from '@nestjs/common';
import { ProjectIoService } from './project-io.service';
import { DatabaseIoModule } from '../database-io/database-io.module';

@Module({
  imports: [DatabaseIoModule],
  providers: [ProjectIoService],
  exports: [ProjectIoService]
})
export class ProjectIoModule {}

import { Module } from '@nestjs/common';
import { ProjectIoService } from './project-io.service';

@Module({
  providers: [ProjectIoService],
  exports: [ProjectIoService],
})
export class ProjectIoModule {}

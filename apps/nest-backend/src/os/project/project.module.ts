import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { FileModule } from '../file/file.module';

@Module({
  imports: [FileModule],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}

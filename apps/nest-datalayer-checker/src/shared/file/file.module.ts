import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { ProjectModule } from '../project/project.module';
import { ProjectService } from '../project/project.service';

@Module({
  imports: [ProjectModule],
  providers: [FileService, ProjectService],
})
export class FileModule {}

import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { ProjectModule } from './project/project.module';
import { ProjectService } from './project/project.service';
import { FileModule } from './file/file.module';
import { FileService } from './file/file.service';

@Module({
  providers: [SharedService, ProjectService, FileService],
  exports: [SharedService, ProjectService],
  imports: [ProjectModule, FileModule],
})
export class SharedModule {}

import { Module } from '@nestjs/common';
import { OsModule } from '../../../infrastructure/os/os.module';
import { ProjectImageService } from './project-image.service';

@Module({
  imports: [OsModule],
  providers: [ProjectImageService],
  exports: [ProjectImageService]
})
export class ProjectImageModule {}

import { Module } from '@nestjs/common';
import { ProjectIoService } from './project-io.service';
import { ProjectCompressor } from './project-compressor.service';
import { ProjectUnzipper } from './project-unzipper.service';

@Module({
  imports: [],
  providers: [ProjectIoService, ProjectCompressor, ProjectUnzipper],
  exports: [ProjectIoService, ProjectCompressor, ProjectUnzipper]
})
export class ProjectIoModule {}

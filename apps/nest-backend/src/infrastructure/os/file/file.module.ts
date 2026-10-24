import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { PathModule } from '../path/path.module';

@Module({
  imports: [PathModule],
  providers: [FileService],
  exports: [FileService]
})
export class FileModule {}

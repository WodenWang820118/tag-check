import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { PathModule } from '../path/path.module';
import { FolderModule } from '../folder/folder.module';
@Module({
  imports: [PathModule, FolderModule],
  providers: [FileService],
  exports: [FileService, PathModule, FolderModule]
})
export class FileModule {}

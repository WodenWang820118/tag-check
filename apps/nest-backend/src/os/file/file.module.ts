import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { PathModule } from '../path/path.module';
import { FolderModule } from '../folder/folder.module';
import { FolderService } from '../folder/folder.service';
@Module({
  imports: [PathModule, FolderModule],
  providers: [FileService, FolderService],
  exports: [FileService, PathModule, FolderModule],
})
export class FileModule {}

import { Module } from '@nestjs/common';
import { PathModule } from '../path/path.module';
import { FolderModule } from '../folder/folder.module';
import { FolderService } from '../folder/folder.service';
import { ImageService } from './image.service';

@Module({
  imports: [PathModule, FolderModule],
  providers: [FolderService, ImageService],
  exports: [ImageService],
})
export class ImageModule {}

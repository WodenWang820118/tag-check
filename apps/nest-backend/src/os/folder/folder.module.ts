import { Module } from '@nestjs/common';
import { FolderService } from './folder.service';

@Module({
  providers: [FolderService],
  exports: [FolderService],
})
export class FolderModule {}

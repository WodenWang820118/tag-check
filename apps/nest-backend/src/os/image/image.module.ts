import { Module } from '@nestjs/common';
import { PathModule } from '../path/path.module';
import { ImageService } from './image.service';

@Module({
  imports: [PathModule],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}

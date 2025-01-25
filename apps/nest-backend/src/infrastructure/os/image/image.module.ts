import { Module } from '@nestjs/common';
import { PathModule } from '../path/path.module';
import { ImageService } from './image.service';
import { ImageResultService } from '../../../features/test-result/services/image-result.service';
import { TestResultModule } from '../../../features/test-result/test-result.module';

@Module({
  imports: [PathModule, TestResultModule],
  providers: [ImageService, ImageResultService],
  exports: [ImageService]
})
export class ImageModule {}

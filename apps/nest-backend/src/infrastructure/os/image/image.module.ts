import { Module } from '@nestjs/common';
import { PathModule } from '../path/path.module';
import { ImageService } from './image.service';
import { TestEventRepositoryModule } from '../../../core/repository/test-event/test-event-repository.module';

@Module({
  imports: [PathModule, TestEventRepositoryModule],
  providers: [ImageService],
  exports: [ImageService]
})
export class ImageModule {}

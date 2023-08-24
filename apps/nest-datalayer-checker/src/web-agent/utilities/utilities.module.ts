import { Module } from '@nestjs/common';
import { UtilitiesService } from './utilities.service';

@Module({
  providers: [UtilitiesService],
  exports: [UtilitiesService],
})
export class UtilitiesModule {}

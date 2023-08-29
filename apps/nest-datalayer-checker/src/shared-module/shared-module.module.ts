import { Module } from '@nestjs/common';
import { SharedServiceService } from './shared-service.service';

@Module({
  providers: [SharedServiceService],
  exports: [SharedServiceService],
})
export class SharedModuleModule {}

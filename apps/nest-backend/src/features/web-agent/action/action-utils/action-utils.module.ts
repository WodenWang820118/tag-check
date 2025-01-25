import { Module } from '@nestjs/common';
import { ActionUtilsService } from './action-utils.service';

@Module({
  imports: [],
  providers: [ActionUtilsService],
  exports: [ActionUtilsService],
})
export class ActionUtilsModule {}

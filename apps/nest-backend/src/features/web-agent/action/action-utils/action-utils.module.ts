import { Module } from '@nestjs/common';
import { ActionUtilsService } from './action-utils.service';

/** Provides selector classification and element lookup. */
@Module({
  imports: [],
  providers: [ActionUtilsService],
  exports: [ActionUtilsService]
})
export class ActionUtilsModule {}

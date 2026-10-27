import { Module } from '@nestjs/common';
import { RunRecordingsService } from './run-recordings.service';
import { PathModule } from '../path/path.module';

/** The screen recordings of a test's runs; see RunRecordingsService. */
@Module({
  imports: [PathModule],
  providers: [RunRecordingsService],
  exports: [RunRecordingsService]
})
export class RunRecordingsModule {}

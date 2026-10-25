import { Module } from '@nestjs/common';
import { OsModule } from '../../infrastructure/os/os.module';
import { EventInspectionModule } from '../event-inspection/event-inspection.module';
import { GtmOperatorModule } from '../gtm-operator/gtm-operator.module';
import { TestRunService } from './test-run.service';

/** Provides runs of a test from its project's settings. */
@Module({
  imports: [OsModule, EventInspectionModule, GtmOperatorModule],
  providers: [TestRunService],
  exports: [TestRunService]
})
export class TestRunModule {}

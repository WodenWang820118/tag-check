import { Module } from '@nestjs/common';
import { OsModule } from '../../infrastructure/os/os.module';
import { EventsGatewayModule } from '../../core/events-gateway/events-gateway.module';
import { TestRunModule } from '../test-run/test-run.module';
import { BatchQueueService } from './batch-queue.service';
import { ScheduleService } from './schedule.service';

/** Provides the backend's batch queue and the schedules that feed it. */
@Module({
  imports: [OsModule, EventsGatewayModule, TestRunModule],
  providers: [BatchQueueService, ScheduleService],
  exports: [BatchQueueService, ScheduleService]
})
export class BatchQueueModule {}

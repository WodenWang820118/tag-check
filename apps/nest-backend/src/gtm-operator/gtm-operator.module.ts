import { Module } from '@nestjs/common';
import { GtmOperatorService } from './gtm-operator.service';
import { EventInspectionPipelineModule } from '../event-inspection-pipeline/event-inspection-pipeline.module';

@Module({
  imports: [EventInspectionPipelineModule],
  providers: [GtmOperatorService],
  exports: [GtmOperatorService],
})
export class GtmOperatorModule {}

import { Module } from '@nestjs/common';
import { InspectorGroupEventsService } from './inspector-group-events.service';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { OsModule } from '../os/os.module';
import { RequestProcessorModule } from './request-processor/request-processor.module';
import { RequestProcessorService } from './request-processor/request-processor.service';
import { InspectorUtilsService } from './inspector-utils.service';
import { InspectorSingleEventService } from './inspector-single-event.service';

const services = [
  InspectorGroupEventsService,
  InspectorUtilsService,
  InspectorSingleEventService,
  RequestProcessorService,
];
@Module({
  imports: [WebAgentModule, OsModule, RequestProcessorModule],
  providers: [...services],
  exports: [...services],
})
export class InspectorModule {}

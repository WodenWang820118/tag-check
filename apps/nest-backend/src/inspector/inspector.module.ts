import { Module } from '@nestjs/common';
import { InspectorGroupEventsService } from './inspector-group-events.service';
import { WebAgentModule } from '../web-agent/web-agent.module';
import { RequestProcessorModule } from '../request-processor/request-processor.module';
import { RequestProcessorService } from '../request-processor/request-processor.service';
import { InspectorUtilsService } from './inspector-utils.service';
import { InspectorSingleEventService } from './inspector-single-event.service';
import { ProjectAgentModule } from '../project-agent/project-agent.module';

const services = [
  InspectorGroupEventsService,
  InspectorUtilsService,
  InspectorSingleEventService,
  RequestProcessorService,
];
@Module({
  imports: [WebAgentModule, RequestProcessorModule, ProjectAgentModule],
  providers: [...services],
  exports: [...services, ProjectAgentModule],
})
export class InspectorModule {}

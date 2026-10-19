import { Module } from '@nestjs/common';
import { GtmParserService } from './gtm-parser.service';
import { ProjectEventsBuilderModule } from '../project-agent/project-events-builder/project-events-builder.module';

@Module({
  imports: [ProjectEventsBuilderModule],
  providers: [GtmParserService],
  exports: [GtmParserService]
})
export class GtmParserModule {}

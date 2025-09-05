import { Module } from '@nestjs/common';
import { OsModule } from '../../infrastructure/os/os.module';
import { GtmParserService } from './gtm-parser.service';
import { ProjectEventsBuilderModule } from '../project-agent/project-events-builder/project-events-builder.module';

@Module({
  imports: [OsModule, ProjectEventsBuilderModule],
  providers: [GtmParserService],
  exports: [GtmParserService]
})
export class GtmParserModule {}

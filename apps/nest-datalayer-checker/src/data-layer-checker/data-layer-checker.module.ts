import { AirtableModule } from './../airtable/airtable.module';
import { Module } from '@nestjs/common';
import { DataLayerCheckerController } from './data-layer-checker.controller';
import { DataLayerCheckerService } from './data-layer-checker.service';
import { HttpModule } from '@nestjs/axios';
import { GtmOperatorModule } from '../gtm-operator/gtm-operator.module';
import { WebAgentModule } from '../web-agent/web-agent.module';

@Module({
  imports: [HttpModule, AirtableModule, GtmOperatorModule, WebAgentModule],
  controllers: [DataLayerCheckerController],
  providers: [DataLayerCheckerService],
})
export class DataLayerCheckerModule {}

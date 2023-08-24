import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AirtableModule } from './airtable/airtable.module';
import { DataLayerCheckerModule } from './data-layer-checker/data-layer-checker.module';
import { GtmOperatorModule } from './gtm-operator/gtm-operator.module';
import { WebAgentModule } from './web-agent/web-agent.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    WebAgentModule,
    AirtableModule,
    DataLayerCheckerModule,
    GtmOperatorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

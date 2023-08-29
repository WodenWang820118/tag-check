import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AirtableModule } from './airtable/airtable.module';
import { DataLayerCheckerModule } from './data-layer-checker/data-layer-checker.module';
import { GtmOperatorModule } from './gtm-operator/gtm-operator.module';
import { WebAgentModule } from './web-agent/web-agent.module';
import { SharedModuleModule } from './shared-module/shared-module.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    WebAgentModule,
    AirtableModule,
    DataLayerCheckerModule,
    GtmOperatorModule,
    SharedModuleModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GtmOperatorModule } from './gtm-operator/gtm-operator.module';
import { WebAgentModule } from './web-agent/web-agent.module';
import { SharedModule } from './shared/shared.module';
import { InspectorModule } from './inspector/inspector.module';
import { WaiterModule } from './waiter/waiter.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    WebAgentModule,
    GtmOperatorModule,
    SharedModule,
    InspectorModule,
    WaiterModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

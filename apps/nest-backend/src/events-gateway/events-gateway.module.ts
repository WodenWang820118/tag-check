import { Module } from '@nestjs/common';
import { EventsGatewayService } from './events-gateway.service';

@Module({
  providers: [EventsGatewayService],
})
export class EventsGatewayModule {}

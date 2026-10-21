import { Module } from '@nestjs/common';
import { EventsGatewayService } from './events-gateway.service';

/** The progress WebSocket gateway; import this module to send progress. */
@Module({
  providers: [EventsGatewayService],
  exports: [EventsGatewayService]
})
export class EventsGatewayModule {}

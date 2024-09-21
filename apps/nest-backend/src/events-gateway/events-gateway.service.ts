import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'dgram';
import { Server } from 'http';
import { Log } from '../logging-interceptor/logging-interceptor.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway(7002, {
  transports: ['websocket'],
  namespace: 'events',
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
})
export class EventsGatewayService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  afterInit(socket: Server) {
    Logger.log(
      `The socket has been initialized`,
      `${EventsGatewayService.name}.${EventsGatewayService.prototype.afterInit.name}`
    );
  }

  handleConnection(client: Socket, ...args: any[]) {
    Logger.log(
      `Handle connection`,
      `${EventsGatewayService.name}.${EventsGatewayService.prototype.afterInit.name}`
    );
  }

  handleDisconnect(client: Socket) {
    Logger.log(
      `Handle disconnection`,
      `${EventsGatewayService.name}.${EventsGatewayService.prototype.afterInit.name}`
    );
  }

  @SubscribeMessage('events')
  @Log()
  handleEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket
  ): string {
    return data;
  }

  sendToAll(event: string, message: any) {
    this.server.emit(event, message);
  }

  sendProgressUpdate(totalSteps: number, currentStep: number) {
    this.server.emit('progressUpdate', { totalSteps, currentStep });
  }
}

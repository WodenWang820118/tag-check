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
  private readonly logger = new Logger(EventsGatewayService.name);
  @WebSocketServer() server!: Server;

  afterInit(socket: Server) {
    this.logger.log('The socket has been initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log('Handle connection');
  }

  handleDisconnect(client: Socket) {
    this.logger.log('Handle disconnect');
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

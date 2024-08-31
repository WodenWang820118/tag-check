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
import { Logger } from '@nestjs/common';

@WebSocketGateway(81, {
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
  @WebSocketServer() server: Server;

  afterInit(socket: Server) {
    Logger.log('WebSocket Gateway initialized', `${EventsGatewayService.name}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    Logger.log('Client connected', `${EventsGatewayService.name}`);
  }

  handleDisconnect(client: Socket) {
    Logger.log('Client disconnected', `${EventsGatewayService.name}`);
  }

  @SubscribeMessage('events')
  handleEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket
  ): string {
    Logger.log(`Received message: ${data}`, `${EventsGatewayService.name}`);
    return data;
  }

  sendToAll(event: string, message: any) {
    this.server.emit(event, message);
  }

  sendProgressUpdate(totalSteps: number, currentStep: number) {
    this.server.emit('progressUpdate', { totalSteps, currentStep });
  }
}

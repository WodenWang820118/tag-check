import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody
} from '@nestjs/websockets';
import { Server } from 'http';
import { Logger } from '@nestjs/common';

// During test environment we bind to an ephemeral port 0 to avoid EADDRINUSE collisions
const wsPort =
  process.env.NODE_ENV === 'test'
    ? 0
    : Number(process.env.WEB_SOCKET as unknown as string) || 7002;

@WebSocketGateway(wsPort, {
  transports: ['websocket'],
  namespace: 'events',
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
})
export class EventsGatewayService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGatewayService.name);
  @WebSocketServer() server!: Server;

  afterInit() {
    this.logger.log('The socket has been initialized');
  }

  handleConnection() {
    this.logger.log('Handle connection');
  }

  handleDisconnect() {
    this.logger.log('Handle disconnect');
  }

  @SubscribeMessage('events')
  handleEvent(@MessageBody() data: string): string {
    return data;
  }

  sendToAll(event: string, message: unknown) {
    this.server.emit(event, message);
  }

  sendProgressUpdate(totalSteps: number, currentStep: number) {
    this.server.emit('progressUpdate', { totalSteps, currentStep });
  }

  sendEventCompleted(message: unknown) {
    this.server.emit('eventCompleted', { message });
  }
}

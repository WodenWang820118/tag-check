import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket;
  private connectionStatus = signal<boolean>(false);
  connectionStatus$ = computed(() => this.connectionStatus());
  constructor() {
    this.socket = io(environment.webSocketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('events', (message) => {
      console.log('Received message:', message);
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connectionStatus.set(true);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  getSocket(): Socket {
    return this.socket;
  }

  sendMessage(message: string) {
    this.socket.emit('events', message);
  }
}

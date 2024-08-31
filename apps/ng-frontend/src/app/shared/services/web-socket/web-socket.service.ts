import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:81/events', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('events', (message) => {
      console.log('Received message:', message);
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.sendMessage('Hello from client');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  sendMessage(message: string) {
    this.socket.emit('events', message);
  }
}

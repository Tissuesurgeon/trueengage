import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import type { SocketEvent } from '@trueengage/shared';

let io: Server | undefined;

export function initSocket(httpServer: HttpServer, corsOrigins: string[]) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigins, methods: ['GET', 'POST'] },
  });
  return io;
}

export function getSocket(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function emitEvent(event: SocketEvent) {
  if (!io) return;
  io.emit(event.type, event);
}

import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import type { SocketEvent } from '@trueengage/shared';

let io: Server | undefined;

export function initSocket(
  httpServer: HttpServer,
  allowOrigin: (origin: string | undefined) => boolean,
) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (allowOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Socket CORS blocked for origin: ${origin}`));
      },
      methods: ['GET', 'POST'],
    },
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

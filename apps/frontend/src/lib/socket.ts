'use client';

import { io, type Socket } from 'socket.io-client';

let socket: Socket | undefined;

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';
    socket = io(url, { transports: ['websocket', 'polling'] });
  }
  return socket;
}

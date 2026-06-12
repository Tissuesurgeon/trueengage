'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

export function useSocketEvent<T>(event: string, initial: T): T {
  const [data, setData] = useState<T>(initial);

  useEffect(() => {
    const socket = getSocket();
    const handler = (payload: T) => setData(payload);
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event]);

  return data;
}

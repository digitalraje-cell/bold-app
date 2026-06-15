'use client';

import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function useSocket(meetingId: string) {
  useEffect(() => {
    socket = io(`${SOCKET_URL}/meetings`, {
      query: { meetingId },
      transports: ['websocket'],
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [meetingId]);

  const emit = useCallback((event: string, data: unknown) => {
    socket?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socket?.on(event, handler);
    return () => {
      socket?.off(event, handler);
    };
  }, []);

  return { emit, on, socket };
}

export function getSocket() {
  return socket;
}

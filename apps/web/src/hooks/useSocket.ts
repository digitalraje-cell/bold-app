'use client';

import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

import { getSocketOrigin } from '@/lib/api-base';

type SocketEntry = { socket: Socket; refs: number };

const meetingSockets = new Map<string, SocketEntry>();

function getEntry(meetingId: string): SocketEntry | undefined {
  return meetingSockets.get(meetingId);
}

function getOrCreateSocket(meetingId: string): Socket {
  let entry = meetingSockets.get(meetingId);
  if (!entry) {
    const socketUrl = getSocketOrigin();
    const socket = io(`${socketUrl}/meetings`, {
      query: { meetingId },
      transports: ['websocket'],
    });
    entry = { socket, refs: 0 };
    meetingSockets.set(meetingId, entry);
  }
  return entry.socket;
}

function emitWhenConnected(socket: Socket, event: string, data: unknown) {
  if (socket.connected) {
    socket.emit(event, data);
    return;
  }
  socket.once('connect', () => socket.emit(event, data));
}

export function useSocket(meetingId: string) {
  useEffect(() => {
    if (!meetingId) return;

    getOrCreateSocket(meetingId);
    const entry = meetingSockets.get(meetingId)!;
    entry.refs += 1;

    return () => {
      entry.refs -= 1;
      if (entry.refs <= 0) {
        entry.socket.disconnect();
        meetingSockets.delete(meetingId);
      }
    };
  }, [meetingId]);

  const emit = useCallback(
    (event: string, data: unknown) => {
      const entry = getEntry(meetingId);
      if (!entry) return;
      emitWhenConnected(entry.socket, event, data);
    },
    [meetingId],
  );

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      const entry = getEntry(meetingId);
      if (!entry) return () => undefined;
      entry.socket.on(event, handler);
      return () => {
        entry.socket.off(event, handler);
      };
    },
    [meetingId],
  );

  return { emit, on, socket: getEntry(meetingId)?.socket ?? null };
}

export function getSocket(meetingId?: string) {
  if (meetingId) return getEntry(meetingId)?.socket ?? null;
  const first = meetingSockets.values().next().value as SocketEntry | undefined;
  return first?.socket ?? null;
}

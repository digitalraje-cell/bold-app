'use client';

import { createContext, useContext } from 'react';

type MeetingFullscreenContextValue = {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
};

export const MeetingFullscreenContext = createContext<MeetingFullscreenContextValue | null>(
  null,
);

export function useMeetingFullscreen(): MeetingFullscreenContextValue {
  const ctx = useContext(MeetingFullscreenContext);
  if (!ctx) {
    throw new Error('useMeetingFullscreen must be used within FullscreenWrapper');
  }
  return ctx;
}

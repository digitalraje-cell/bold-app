'use client';

import { ReactNode, useMemo, useRef } from 'react';
import { Minimize2 } from 'lucide-react';
import { useFullscreen } from '@/hooks/useFullscreen';
import { MeetingFullscreenContext } from '@/contexts/MeetingFullscreenContext';

interface FullscreenWrapperProps {
  children: ReactNode;
}

export function FullscreenWrapper({ children }: FullscreenWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen(containerRef);
  const contextValue = useMemo(
    () => ({ isFullscreen, toggleFullscreen }),
    [isFullscreen, toggleFullscreen],
  );

  return (
    <MeetingFullscreenContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={`relative flex flex-col bg-slate-900 ${
          isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'min-h-screen h-[100dvh]'
        }`}
      >
        {children}

        {isFullscreen && (
          <button
            type="button"
            onClick={() => void exitFullscreen()}
            aria-label="Exit fullscreen"
            className="fixed bottom-[calc(var(--meeting-controls-offset,5.5rem)+env(safe-area-inset-bottom,0px)+1rem)] right-4 z-[60] inline-flex items-center gap-2 rounded-full bg-black/75 px-4 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur transition hover:bg-black/90 sm:right-6"
          >
            <Minimize2 className="h-4 w-4" />
            Exit Fullscreen
          </button>
        )}
      </div>
    </MeetingFullscreenContext.Provider>
  );
}

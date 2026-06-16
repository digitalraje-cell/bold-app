'use client';

import { useEffect, useState, ReactNode, useRef } from 'react';
import { Minimize2 } from 'lucide-react';
import { useFullscreen } from '@/hooks/useFullscreen';
import { MeetingFullscreenContext } from '@/contexts/MeetingFullscreenContext';

interface FullscreenWrapperProps {
  children: ReactNode;
}

export function FullscreenWrapper({ children }: FullscreenWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen(containerRef);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-900">{children}</div>;
  }

  return (
    <MeetingFullscreenContext.Provider value={{ isFullscreen, toggleFullscreen }}>
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
            className="fixed bottom-24 right-6 z-[60] inline-flex items-center gap-2 rounded-full bg-black/75 px-4 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur transition hover:bg-black/90"
          >
            <Minimize2 className="h-4 w-4" />
            Exit Fullscreen
          </button>
        )}
      </div>
    </MeetingFullscreenContext.Provider>
  );
}

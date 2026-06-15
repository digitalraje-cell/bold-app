'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { Maximize2 } from 'lucide-react';

interface FullscreenWrapperProps {
  children: ReactNode;
  isFullscreen: boolean;
  onToggle: (value: boolean) => void;
}

export function FullscreenWrapper({
  children,
  isFullscreen,
  onToggle,
}: FullscreenWrapperProps) {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  const enterFullscreen = useCallback(async () => {
    if (!containerRef) return;
    try {
      await containerRef.requestFullscreen();
      onToggle(true);
    } catch {
      onToggle(true);
    }
  }, [containerRef, onToggle]);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    onToggle(false);
  }, [onToggle]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      onToggle(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        onToggle(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggle]);

  return (
    <div
      ref={setContainerRef}
      className={`relative flex flex-col bg-slate-900 ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'h-[calc(100vh-0px)] min-h-screen'
      }`}
    >
      {children}

      {isFullscreen && (
        <button
          onClick={exitFullscreen}
          className="fixed bottom-24 right-6 z-[60] rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/90"
        >
          Exit Fullscreen
        </button>
      )}

      {!isFullscreen && (
        <button
          onClick={enterFullscreen}
          className="sr-only"
          aria-label="Enter fullscreen"
        >
          <Maximize2 className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

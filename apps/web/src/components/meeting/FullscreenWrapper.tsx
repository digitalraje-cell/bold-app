'use client';

import { useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { Minimize2 } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      await el.requestFullscreen();
      onToggle(true);
    } catch {
      onToggle(true);
    }
  }, [onToggle]);

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
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggle]);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-900">{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-900 ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'min-h-screen h-[100dvh]'
      }`}
    >
      {children}

      {isFullscreen && (
        <button
          onClick={exitFullscreen}
          aria-label="Exit fullscreen"
          className="fixed bottom-24 right-6 z-[60] inline-flex items-center gap-2 rounded-full bg-black/75 px-4 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur transition hover:bg-black/90"
        >
          <Minimize2 className="h-4 w-4" />
          Exit Fullscreen
        </button>
      )}
    </div>
  );
}

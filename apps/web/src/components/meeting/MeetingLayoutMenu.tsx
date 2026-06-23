'use client';

import { useEffect, useRef, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import type { MeetingLayoutMode } from '@/lib/meeting-layout-prefs';
import { cn } from '@/lib/utils';

const QUICK_LAYOUTS: { id: MeetingLayoutMode; label: string }[] = [
  { id: 'speaker', label: 'Speaker' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'filmstrip', label: 'Filmstrip' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'compact', label: 'Compact' },
];

interface MeetingLayoutMenuProps {
  layoutMode: MeetingLayoutMode;
  onSelectLayout: (mode: MeetingLayoutMode) => void;
  onOpenSettings: () => void;
}

export function MeetingLayoutMenu({
  layoutMode,
  onSelectLayout,
  onOpenSettings,
}: MeetingLayoutMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-all duration-200 sm:h-12 sm:w-12',
          open ? 'bg-white text-black shadow-sm' : 'bg-white/12 text-white hover:bg-white/20',
        )}
        aria-label="Layout"
        title="Layout"
      >
        <LayoutGrid className="h-5 w-5" />
      </button>

      {open ? (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-44 -translate-x-1/2 rounded-[var(--radius-md)] border border-white/10 bg-black/90 p-1 shadow-[var(--shadow-elevated)] backdrop-blur">
          {QUICK_LAYOUTS.map((layout) => (
            <button
              key={layout.id}
              type="button"
              onClick={() => {
                onSelectLayout(layout.id);
                setOpen(false);
              }}
              className={cn(
                'block w-full rounded px-3 py-2 text-left text-sm text-white hover:bg-white/10',
                layoutMode === layout.id && 'bg-white/15 font-semibold',
              )}
            >
              {layout.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              setOpen(false);
            }}
            className="mt-1 block w-full rounded border-t border-white/10 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
          >
            Layout settings…
          </button>
        </div>
      ) : null}
    </div>
  );
}

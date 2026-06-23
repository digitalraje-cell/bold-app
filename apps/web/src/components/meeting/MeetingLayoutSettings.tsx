'use client';

import { LayoutGrid, X } from 'lucide-react';
import type {
  MeetingLayoutMode,
  MeetingLayoutPrefs,
  ParticipantDockPosition,
  ThumbnailPanelMode,
  ThumbnailSize,
} from '@/lib/meeting-layout-prefs';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { cn } from '@/lib/utils';

const LAYOUT_MODES: { id: MeetingLayoutMode; label: string; description: string }[] = [
  { id: 'filmstrip', label: 'Filmstrip', description: 'Large stage with a scrollable strip' },
  { id: 'gallery', label: 'Gallery', description: 'Equal grid of all participants' },
  { id: 'speaker', label: 'Speaker view', description: 'Active speaker large, others small' },
  { id: 'pinned', label: 'Pinned view', description: 'Keep your pinned participant large' },
  { id: 'compact', label: 'Compact', description: 'Minimized tiles and more stage space' },
];

const DOCK_POSITIONS: ParticipantDockPosition[] = ['RIGHT', 'TOP', 'BOTTOM', 'LEFT', 'FLOATING'];
const THUMBNAIL_MODES: { id: ThumbnailPanelMode; label: string }[] = [
  { id: 'open_all', label: 'Open all' },
  { id: 'minimized', label: 'Minimized' },
  { id: 'single', label: 'Single visible' },
  { id: 'hidden', label: 'Hidden' },
];
const THUMBNAIL_SIZES: ThumbnailSize[] = ['small', 'medium', 'large'];

interface MeetingLayoutSettingsProps {
  open: boolean;
  prefs: MeetingLayoutPrefs;
  onClose: () => void;
  onChange: (patch: Partial<MeetingLayoutPrefs>) => void;
}

export function MeetingLayoutSettings({
  open,
  prefs,
  onClose,
  onChange,
}: MeetingLayoutSettingsProps) {
  if (!open) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="max-h-[min(90dvh,720px)] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-elevated)] sm:p-6"
        role="dialog"
        aria-label="Meeting layout settings"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Meeting layout</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-md)] p-2 hover:bg-muted"
            aria-label="Close layout settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Layout mode</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {LAYOUT_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChange({ layoutMode: mode.id })}
                className={cn(
                  'rounded-[var(--radius-md)] border px-3 py-2 text-left transition',
                  prefs.layoutMode === mode.id
                    ? 'border-foreground bg-muted'
                    : 'border-border hover:bg-muted/60',
                )}
              >
                <span className="block text-sm font-medium">{mode.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{mode.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Dock position</h3>
          <div className="flex flex-wrap gap-2">
            {DOCK_POSITIONS.map((position) => (
              <Button
                key={position}
                type="button"
                size="sm"
                variant={prefs.dockPosition === position ? 'primary' : 'secondary'}
                onClick={() => onChange({ dockPosition: position })}
              >
                {position}
              </Button>
            ))}
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Thumbnail panel</h3>
          <div className="flex flex-wrap gap-2">
            {THUMBNAIL_MODES.map((mode) => (
              <Button
                key={mode.id}
                type="button"
                size="sm"
                variant={prefs.thumbnailPanelMode === mode.id ? 'primary' : 'secondary'}
                onClick={() => onChange({ thumbnailPanelMode: mode.id })}
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Thumbnail size</h3>
          <div className="flex flex-wrap gap-2">
            {THUMBNAIL_SIZES.map((size) => (
              <Button
                key={size}
                type="button"
                size="sm"
                variant={prefs.thumbnailSize === size ? 'primary' : 'secondary'}
                onClick={() => onChange({ thumbnailSize: size })}
              >
                {size}
              </Button>
            ))}
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <Toggle
            checked={prefs.autoHideControls}
            onChange={(checked) => onChange({ autoHideControls: checked })}
            label="Auto-hide controls"
          />
          <Toggle
            checked={prefs.showParticipantNames}
            onChange={(checked) => onChange({ showParticipantNames: checked })}
            label="Show participant names"
          />
          <Toggle
            checked={prefs.showActiveSpeakerIndicator}
            onChange={(checked) => onChange({ showActiveSpeakerIndicator: checked })}
            label="Show active speaker indicator"
          />
        </section>

        <p className="mt-5 text-xs text-muted-foreground">
          Double-tap a participant thumbnail to pin or unpin. Layout preferences are saved on this
          device.
        </p>
      </div>
    </div>
  );
}

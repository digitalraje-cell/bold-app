'use client';

import { LayoutGrid, X } from 'lucide-react';
import type {
  AttendeeLayoutPrefs,
  DockPosition,
  DockViewMode,
  SelfViewCorner,
  SelfViewMode,
  StageLayout,
} from '@/lib/attendee-layout-prefs';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { cn } from '@/lib/utils';

interface MeetingLayoutSettingsProps {
  open: boolean;
  prefs: AttendeeLayoutPrefs;
  onClose: () => void;
  onChange: (patch: Partial<AttendeeLayoutPrefs>) => void;
}

export function MeetingLayoutSettings({
  open,
  prefs,
  onClose,
  onChange,
}: MeetingLayoutSettingsProps) {
  if (!open) return null;

  const stageLayouts: { id: StageLayout; label: string; description: string }[] = [
    { id: 'speaker', label: 'Speaker view', description: 'Large active speaker on stage' },
    { id: 'grid', label: 'Grid view', description: 'Equal tiles for all participants' },
  ];

  const dockPositions: { id: DockPosition; label: string }[] = [
    { id: 'right', label: 'Right dock' },
    { id: 'top', label: 'Top dock' },
    { id: 'hidden', label: 'Hidden' },
  ];

  const dockViewModes: { id: DockViewMode; label: string }[] = [
    { id: 'speaker', label: 'Active speaker' },
    { id: 'participants', label: 'All participants' },
  ];

  const selfViewModes: { id: SelfViewMode; label: string }[] = [
    { id: 'hidden', label: 'Hide self view' },
    { id: 'small', label: 'Small thumbnail' },
    { id: 'large', label: 'Large thumbnail' },
    { id: 'floating', label: 'Floating window' },
  ];

  const corners: { id: SelfViewCorner; label: string }[] = [
    { id: 'top-left', label: 'Top left' },
    { id: 'top-right', label: 'Top right' },
    { id: 'bottom-left', label: 'Bottom left' },
    { id: 'bottom-right', label: 'Bottom right' },
  ];

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
            <h2 className="text-lg font-semibold">Layout & dock</h2>
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
          <h3 className="text-sm font-semibold text-foreground">Stage layout</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {stageLayouts.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChange({ stageLayout: mode.id })}
                className={cn(
                  'rounded-[var(--radius-md)] border px-3 py-2 text-left transition',
                  prefs.stageLayout === mode.id
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
          <h3 className="text-sm font-semibold text-foreground">Attendee dock</h3>
          <div className="flex flex-wrap gap-2">
            {dockPositions.map((position) => (
              <Button
                key={position.id}
                type="button"
                size="sm"
                variant={prefs.dockPosition === position.id ? 'primary' : 'secondary'}
                onClick={() => onChange({ dockPosition: position.id, dockCollapsed: false })}
              >
                {position.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {dockViewModes.map((mode) => (
              <Button
                key={mode.id}
                type="button"
                size="sm"
                variant={prefs.dockViewMode === mode.id ? 'primary' : 'secondary'}
                onClick={() => onChange({ dockViewMode: mode.id })}
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Self view</h3>
          <div className="flex flex-wrap gap-2">
            {selfViewModes.map((mode) => (
              <Button
                key={mode.id}
                type="button"
                size="sm"
                variant={prefs.selfViewMode === mode.id ? 'primary' : 'secondary'}
                onClick={() => onChange({ selfViewMode: mode.id })}
              >
                {mode.label}
              </Button>
            ))}
          </div>
          {prefs.selfViewMode === 'floating' && (
            <div className="flex flex-wrap gap-2">
              {corners.map((corner) => (
                <Button
                  key={corner.id}
                  type="button"
                  size="sm"
                  variant={prefs.selfViewCorner === corner.id ? 'primary' : 'secondary'}
                  onClick={() =>
                    onChange({
                      selfViewCorner: corner.id,
                      selfViewFloating: {
                        ...prefs.selfViewFloating,
                        ...(corner.id === 'top-left'
                          ? { x: 16, y: 72 }
                          : corner.id === 'top-right'
                            ? { x: typeof window !== 'undefined' ? window.innerWidth - 156 : 16, y: 72 }
                            : corner.id === 'bottom-left'
                              ? { x: 16, y: typeof window !== 'undefined' ? window.innerHeight - 200 : 72 }
                              : {
                                  x: typeof window !== 'undefined' ? window.innerWidth - 156 : 16,
                                  y: typeof window !== 'undefined' ? window.innerHeight - 200 : 72,
                                }),
                      },
                    })
                  }
                >
                  {corner.label}
                </Button>
              ))}
            </div>
          )}
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
            label="Show participant names in dock"
          />
          <Toggle
            checked={prefs.showActiveSpeakerIndicator}
            onChange={(checked) => onChange({ showActiveSpeakerIndicator: checked })}
            label="Highlight active speaker in dock"
          />
        </section>

        <p className="mt-5 text-xs text-muted-foreground">
          Use the dock toolbar in-meeting for quick layout changes. Double-tap a thumbnail to pin.
          Preferences are saved on this device.
        </p>
      </div>
    </div>
  );
}

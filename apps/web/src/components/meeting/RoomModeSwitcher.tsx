'use client';

import { Presentation, Users } from 'lucide-react';
import { RoomMode } from '@boldmeet/shared';
import { cn } from '@/lib/utils';

interface RoomModeSwitcherProps {
  roomMode: RoomMode;
  onSwitch: (mode: RoomMode) => void;
  disabled?: boolean;
}

export function RoomModeSwitcher({ roomMode, onSwitch, disabled }: RoomModeSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-black/50 p-1 backdrop-blur">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSwitch(RoomMode.MEETING)}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition',
          roomMode === RoomMode.MEETING
            ? 'bg-primary text-primary-foreground'
            : 'text-white/70 hover:text-white hover:bg-white/10',
        )}
      >
        <Users className="h-3.5 w-3.5" />
        Meeting
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSwitch(RoomMode.WEBINAR)}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition',
          roomMode === RoomMode.WEBINAR
            ? 'bg-primary text-primary-foreground'
            : 'text-white/70 hover:text-white hover:bg-white/10',
        )}
      >
        <Presentation className="h-3.5 w-3.5" />
        Webinar
      </button>
    </div>
  );
}

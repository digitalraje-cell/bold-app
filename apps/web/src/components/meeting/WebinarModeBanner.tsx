'use client';

import { RoomMode } from '@boldmeet/shared';

interface WebinarModeBannerProps {
  roomMode: RoomMode;
}

export function WebinarModeBanner({ roomMode }: WebinarModeBannerProps) {
  if (roomMode !== RoomMode.WEBINAR) return null;

  return (
    <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full bg-amber-500/90 px-4 py-1.5 text-xs font-medium text-black shadow-lg">
      Webinar mode — only host, co-hosts, and panelists are visible by default
    </div>
  );
}

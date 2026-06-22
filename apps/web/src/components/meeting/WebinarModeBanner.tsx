'use client';

import { RoomMode } from '@boldmeet/shared';

interface WebinarModeBannerProps {
  roomMode: RoomMode;
}

export function WebinarModeBanner({ roomMode }: WebinarModeBannerProps) {
  if (roomMode !== RoomMode.WEBINAR) return null;

  return (
    <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-white/20 bg-black/60 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md">
      Webinar mode — only host, co-hosts, and panelists are visible by default
    </div>
  );
}

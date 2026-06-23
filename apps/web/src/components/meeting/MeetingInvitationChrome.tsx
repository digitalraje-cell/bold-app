'use client';

import { BoldLogo } from '@/components/brand/BoldLogo';
import { MeetingPosterImage } from '@/components/meeting/MeetingPosterImage';
import { cn } from '@/lib/utils';
import type { PublicMeetingPreview } from '@/components/meeting/MeetingLobby';

type MeetingInvitationChromeProps = {
  preview?: PublicMeetingPreview | null;
  className?: string;
};

export function MeetingInvitationChrome({ preview, className }: MeetingInvitationChromeProps) {
  const posterUrl = preview?.posterUrl ?? null;

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <BoldLogo size={48} priority className="mb-4" />

      {posterUrl ? <MeetingPosterImage src={posterUrl} /> : null}
    </div>
  );
}

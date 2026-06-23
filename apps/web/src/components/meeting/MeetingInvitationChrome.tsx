'use client';

import Image from 'next/image';
import { BoldLogo } from '@/components/brand/BoldLogo';
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

      {posterUrl ? (
        <div className="mb-5 w-full overflow-hidden rounded-xl border border-border bg-muted/30">
          {posterUrl.startsWith('data:') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt=""
              className="aspect-[21/9] w-full object-cover"
            />
          ) : (
            <Image
              src={posterUrl}
              alt=""
              width={840}
              height={360}
              unoptimized
              className="aspect-[21/9] w-full object-cover"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

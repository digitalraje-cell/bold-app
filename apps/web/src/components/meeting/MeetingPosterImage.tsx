'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type MeetingPosterImageProps = {
  src: string;
  className?: string;
};

export function MeetingPosterImage({ src, className }: MeetingPosterImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div className={cn('mb-5 w-full overflow-hidden rounded-xl border border-border bg-muted/30', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className="aspect-[21/9] w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

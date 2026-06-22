'use client';

import { useEffect, useState } from 'react';

/** Matches viewports below Tailwind `md` (768px). */
export const MOBILE_MEETING_MEDIA_QUERY = '(max-width: 767px)';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

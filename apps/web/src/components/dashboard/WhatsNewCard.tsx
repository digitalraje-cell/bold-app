'use client';

import { useEffect, useState } from 'react';
import type { AppVersionResponse } from '@boldmeet/shared';
import { cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export function WhatsNewCard() {
  const [data, setData] = useState<AppVersionResponse | null>(null);

  useEffect(() => {
    void fetch('/api/app/version')
      .then((res) => (res.ok ? res.json() : null))
      .then((json: AppVersionResponse | null) => setData(json))
      .catch(() => setData(null));
  }, []);

  const release = data?.release;
  const version = release?.version ?? data?.appVersion ?? '1.0.0';
  const releaseDate = release?.releaseDate ?? data?.buildTimestamp ?? '';
  const notes =
    release?.releaseNotes?.length
      ? release.releaseNotes
      : ['PWA install support', 'Mobile improvements', 'Faster meeting join'];

  return (
    <section className={cn(cardClass({ bordered: true }), 'mb-10 p-6 sm:p-8')}>
      <div className="mb-5 flex items-center gap-3">
        <div className={ui.iconWell}>
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">What&apos;s New</h2>
          <p className="text-sm text-muted-foreground">
            Version {version}
            {releaseDate ? ` · ${releaseDate}` : ''}
          </p>
        </div>
      </div>
      <ul className="space-y-2 text-sm text-foreground">
        {notes.map((note) => (
          <li key={note} className="flex items-start gap-2">
            <span className="mt-0.5 text-muted-foreground">✓</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

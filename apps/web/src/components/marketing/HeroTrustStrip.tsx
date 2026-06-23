import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRUST_ITEMS = [
  'Team Meetings',
  'Client Calls',
  'Webinars',
  'Online Training',
  'Live Streaming',
  'Remote Collaboration',
] as const;

export function HeroTrustStrip({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-4xl', className)}>
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Built for
      </p>
      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {TRUST_ITEMS.map((item) => (
          <li
            key={item}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90"
          >
            <Check className="h-4 w-4 shrink-0 text-[var(--accent-purple)]" strokeWidth={2.5} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

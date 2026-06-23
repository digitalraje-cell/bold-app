import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROOF_ITEMS = [
  'Browser-Based',
  'HD Video Meetings',
  'Webinar Mode',
  'YouTube Live Streaming',
  'Install as App',
] as const;

export function HeroSocialProofBar({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-8',
        className,
      )}
    >
      {PROOF_ITEMS.map((item) => (
        <li
          key={item}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground/85"
        >
          <Check className="h-4 w-4 shrink-0 text-[var(--accent-purple)]" strokeWidth={2.5} />
          {item}
        </li>
      ))}
    </ul>
  );
}

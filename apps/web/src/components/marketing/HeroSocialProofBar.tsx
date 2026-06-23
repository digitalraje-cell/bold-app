import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROOF_ITEMS = [
  'HD Meetings',
  'Webinar Hosting',
  'Screen Sharing',
  'Browser Based',
  'Cloud Recording (Coming Soon)',
  'Multi-platform Streaming (Coming Soon)',
  'Install as App',
] as const;

export function HeroSocialProofBar({
  className,
  variant = 'light',
}: {
  className?: string;
  variant?: 'light' | 'dark';
}) {
  const isDark = variant === 'dark';

  return (
    <ul
      className={cn(
        'flex flex-wrap items-center justify-center gap-2 sm:gap-2.5',
        className,
      )}
    >
      {PROOF_ITEMS.map((item) => (
        <li
          key={item}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:px-3.5 sm:py-2 sm:text-sm',
            isDark
              ? 'marketing-hero-badge text-white/90'
              : 'border border-[var(--badge-border)] bg-surface text-foreground/85 shadow-[var(--shadow-soft)]',
          )}
        >
          <Check
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              isDark ? 'text-[var(--accent-purple-light)]' : 'text-[var(--accent-purple)]',
            )}
            strokeWidth={2.5}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

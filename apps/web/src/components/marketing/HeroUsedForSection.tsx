import { cn } from '@/lib/utils';

const USE_CASES = [
  'Client Meetings',
  'Team Standups',
  'Webinars',
  'Online Training',
  'Sales Demos',
  'Screen Sharing',
] as const;

export function HeroUsedForSection({ className }: { className?: string }) {
  return (
    <section className={cn('border-y border-border/60 bg-surface-secondary px-6 py-12 sm:py-14', className)}>
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Used for
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {USE_CASES.map((item) => (
            <li
              key={item}
              className="rounded-full border border-[var(--badge-border)] bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-soft)]"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

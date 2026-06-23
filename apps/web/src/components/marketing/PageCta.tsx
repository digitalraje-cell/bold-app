'use client';

import { AuthAwareLink } from '@/components/auth/AuthAwareLink';
import { StartMeetingLink } from '@/components/auth/StartMeetingLink';
import { Button } from '@/components/ui/Button';
import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

export function PageCta({
  title = 'Start your first meeting',
  subtitle = 'Free to start. No download required. Join from any modern browser.',
  primaryLabel = 'Start a Meeting',
  secondaryHref = '/pricing',
  secondaryLabel = 'View pricing',
  className,
}: {
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  return (
    <section className={cn('px-6 py-16 sm:py-20', className)}>
      <div
        className={cn(
          cardClass(),
          'relative mx-auto max-w-4xl overflow-hidden px-8 py-12 text-center sm:px-12 sm:py-14',
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--badge-bg)] via-transparent to-[var(--badge-bg)]/40" />
        <div className="relative">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{subtitle}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <StartMeetingLink>
            <Button size="lg">{primaryLabel}</Button>
          </StartMeetingLink>
          {secondaryHref && (
            <AuthAwareLink href={secondaryHref}>
              <Button size="lg" variant="secondary">
                {secondaryLabel}
              </Button>
            </AuthAwareLink>
          )}
        </div>
        </div>
      </div>
    </section>
  );
}

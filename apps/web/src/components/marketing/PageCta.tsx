'use client';

import { AuthAwareLink } from '@/components/auth/AuthAwareLink';
import { Button } from '@/components/ui/Button';
import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

export function PageCta({
  title = 'Start your first meeting',
  subtitle = 'Free to start. No download required. Join from any modern browser.',
  primaryHref = '/login',
  primaryLabel = 'Get started free',
  secondaryHref = '/#pricing',
  secondaryLabel = 'View pricing',
  className,
}: {
  title?: string;
  subtitle?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  return (
    <section className={cn('px-6 py-16 sm:py-20', className)}>
      <div className={cn(cardClass(), 'mx-auto max-w-4xl px-8 py-12 text-center sm:px-12 sm:py-14')}>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{subtitle}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <AuthAwareLink href={primaryHref}>
            <Button size="lg">{primaryLabel}</Button>
          </AuthAwareLink>
          {secondaryHref && (
            <AuthAwareLink href={secondaryHref}>
              <Button size="lg" variant="secondary">
                {secondaryLabel}
              </Button>
            </AuthAwareLink>
          )}
        </div>
      </div>
    </section>
  );
}

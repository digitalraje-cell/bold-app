'use client';

import Link from 'next/link';
import { appConfig } from '@/lib/app-config';
import { cn } from '@/lib/utils';

type HomeLogoLinkProps = {
  className?: string;
  /** Full mark (icon + name) or wordmark only — e.g. mobile top bar */
  variant?: 'full' | 'wordmark';
  wordmarkClassName?: string;
  onClick?: () => void;
};

export function HomeLogoLink({
  className,
  variant = 'full',
  wordmarkClassName,
  onClick,
}: HomeLogoLinkProps) {
  const logoLetter = appConfig.name.charAt(0).toUpperCase();

  return (
    <Link
      href="/"
      aria-label="Go to homepage"
      onClick={onClick}
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 rounded-sm transition-opacity hover:opacity-90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      {variant === 'full' ? (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {logoLetter}
        </div>
      ) : null}
      <span className={cn('font-semibold tracking-tight', wordmarkClassName ?? 'text-lg')}>
        {appConfig.name}
      </span>
    </Link>
  );
}

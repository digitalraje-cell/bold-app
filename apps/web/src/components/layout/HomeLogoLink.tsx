'use client';

import Link from 'next/link';
import { BoldLogo } from '@/components/brand/BoldLogo';
import { BoldWordmark } from '@/components/brand/BoldWordmark';
import { cn } from '@/lib/utils';

type HomeLogoLinkProps = {
  className?: string;
  /**
   * marketing — gradient BOLD wordmark only (navbar, footer, legal)
   * app — purple icon + wordmark (dashboard sidebar)
   * icon — purple square only (compact shells)
   */
  variant?: 'marketing' | 'app' | 'icon';
  wordmarkClassName?: string;
  onClick?: () => void;
};

export function HomeLogoLink({
  className,
  variant = 'marketing',
  wordmarkClassName,
  onClick,
}: HomeLogoLinkProps) {
  return (
    <Link
      href="/"
      aria-label="Go to homepage"
      onClick={onClick}
      className={cn(
        'inline-flex cursor-pointer items-center rounded-sm transition-opacity hover:opacity-90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-purple)]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        variant === 'app' && 'gap-2.5',
        className,
      )}
    >
      {variant === 'marketing' ? (
        <BoldWordmark size="lg" className={wordmarkClassName} />
      ) : null}
      {variant === 'app' ? (
        <>
          <BoldLogo size={32} />
          <BoldWordmark size="md" className={wordmarkClassName} />
        </>
      ) : null}
      {variant === 'icon' ? <BoldLogo size={36} priority /> : null}
      <span className="sr-only">Bold</span>
    </Link>
  );
}

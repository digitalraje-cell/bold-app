import Link from 'next/link';
import {
  BRAND,
  LOGO_ICON_SIZES,
  LOGO_WORDMARK_SIZES,
  type BoldLogoSize,
  type BoldLogoTheme,
  type BoldLogoVariant,
} from '@/lib/brand';
import { cn } from '@/lib/utils';
import { BoldIconMark } from './BoldIconMark';

export type BoldLogoProps = {
  variant?: BoldLogoVariant;
  theme?: BoldLogoTheme;
  size?: BoldLogoSize;
  showTagline?: boolean;
  href?: string;
  className?: string;
  iconClassName?: string;
};

function resolveWordmarkColor(theme: BoldLogoTheme): string {
  if (theme === 'dark') return 'text-white';
  if (theme === 'light') return 'text-foreground';
  return 'text-foreground dark:text-white';
}

function resolveTaglineColor(theme: BoldLogoTheme): string {
  if (theme === 'dark') return 'text-slate-300';
  if (theme === 'light') return 'text-muted-foreground';
  return 'text-muted-foreground dark:text-slate-400';
}

export function BoldLogo({
  variant = 'full',
  theme = 'auto',
  size = 'md',
  showTagline = false,
  href,
  className,
  iconClassName,
}: BoldLogoProps) {
  const iconSize = LOGO_ICON_SIZES[size];
  const wordmarkClass = LOGO_WORDMARK_SIZES[size];
  const gradientId = `bold-logo-${size}-${theme}`;

  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BoldIconMark size={iconSize} gradientId={gradientId} className={iconClassName} />
      {variant === 'full' && (
        <span className="flex min-w-0 flex-col leading-none">
          <span
            className={cn(
              'font-bold tracking-tight',
              wordmarkClass,
              resolveWordmarkColor(theme),
            )}
          >
            {BRAND.name}
          </span>
          {showTagline && (
            <span className={cn('mt-1 text-[10px] font-medium tracking-wide', resolveTaglineColor(theme))}>
              {BRAND.tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

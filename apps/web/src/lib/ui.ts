import { cn } from '@/lib/utils';

/** Bold V3 — Nixtio-style soft UI helpers */
export const ui = {
  pageTitle: 'text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[3.25rem] lg:leading-[1.08]',
  pageSubtitle: 'mt-4 text-base font-medium leading-relaxed text-muted-foreground sm:text-lg',
  sectionTitle: 'text-2xl font-semibold tracking-tight text-foreground sm:text-3xl',
  sectionSubtitle: 'mt-3 text-base font-medium text-muted-foreground',

  /* Cards — shadow-first, borderless by default (Nixtio) */
  card: 'rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-card)]',
  cardBordered:
    'rounded-[var(--radius-lg)] border border-border/80 bg-surface shadow-[var(--shadow-soft)]',
  cardMuted: 'rounded-[var(--radius-lg)] bg-[var(--badge-bg)]',
  cardInteractive:
    'rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-elevated)]',
  cardPadding: 'p-7 sm:p-9',
  cardPaddingLg: 'p-9 sm:p-11',

  /* Nav — pill active state */
  navItem:
    'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200',
  navItemActive: 'bg-foreground text-background shadow-[var(--shadow-soft)]',
  navItemInactive: 'text-muted-foreground hover:bg-muted hover:text-foreground',

  iconWell:
    'flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--badge-bg)] text-foreground',

  badge:
    'inline-flex items-center rounded-full border border-[var(--badge-border)] bg-[var(--badge-bg)] px-3 py-1 text-xs font-semibold text-[var(--badge-text)]',
  badgeSm:
    'inline-flex items-center rounded-full border border-[var(--badge-border)] bg-[var(--badge-bg)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--badge-text)]',

  link: 'font-medium text-foreground underline-offset-4 hover:underline',
  linkMuted: 'text-muted-foreground underline-offset-4 hover:text-foreground hover:underline',

  eyebrow:
    'inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-[var(--shadow-soft)]',

  meetingGlass:
    'bg-[var(--meeting-glass-bg)] backdrop-blur-[var(--meeting-glass-blur)] backdrop-saturate-150 border border-[var(--meeting-glass-border)]',
  meetingGlassPanel: 'rounded-[var(--radius-meeting)]',
} as const;

export function cardClass(
  options: {
    interactive?: boolean;
    bordered?: boolean;
    muted?: boolean;
    className?: string;
  } = {},
) {
  const base = options.muted
    ? ui.cardMuted
    : options.bordered
      ? ui.cardBordered
      : options.interactive
        ? ui.cardInteractive
        : ui.card;
  return cn(base, options.className);
}

export function navLinkClass(active: boolean, className?: string) {
  return cn(ui.navItem, active ? ui.navItemActive : ui.navItemInactive, className);
}

export function badgeClass(className?: string) {
  return cn(ui.badge, className);
}

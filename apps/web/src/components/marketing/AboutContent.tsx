'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Globe,
  GraduationCap,
  Laptop,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import type { FounderProfile, FounderSocialLinks } from '@boldmeet/shared';
import { BOLD_ABOUT_CONTENT, BOLD_FOUNDERS } from '@boldmeet/shared';
import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { PageCta } from '@/components/marketing/PageCta';
import { Button } from '@/components/ui/Button';
import { badgeClass, cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

const AUDIENCE_ICONS = {
  coaches: Users,
  educators: GraduationCap,
  agencies: Briefcase,
  teams: Users,
} as const;

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FounderSocialLinks({ social, name }: { social: FounderSocialLinks; name: string }) {
  const links = [
    social.linkedin && {
      key: 'linkedin',
      href: social.linkedin,
      label: `${name} on LinkedIn`,
      icon: LinkedInIcon,
    },
    social.x && {
      key: 'x',
      href: social.x,
      label: `${name} on X`,
      icon: XIcon,
    },
  ].filter(Boolean) as {
    key: string;
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];

  if (links.length === 0) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {links.map(({ key, href, label, icon: Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface',
            'text-foreground transition hover:border-foreground/25 hover:bg-[var(--badge-bg)] hover:shadow-[var(--shadow-soft)]',
          )}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

function FounderCard({ founder, reverse }: { founder: FounderProfile; reverse?: boolean }) {
  return (
    <article
      className={cn(
        'grid items-start gap-10 lg:grid-cols-2 lg:gap-16',
        reverse && 'lg:[&>*:first-child]:order-2',
      )}
    >
      <div className="relative mx-auto w-full max-w-sm lg:mx-0">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border/80 bg-surface shadow-[var(--shadow-elevated)]">
          <Image
            src={founder.photoWebp ?? founder.photo}
            alt={founder.name}
            width={400}
            height={400}
            className="aspect-square w-full object-cover"
            style={{ objectPosition: founder.photoFocus ?? 'center' }}
            priority
          />
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {founder.role}
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{founder.name}</h3>
        <FounderSocialLinks social={founder.social} name={founder.name} />
        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
          {founder.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
        {founder.quote && (
          <blockquote className="mt-8 border-l-2 border-border pl-5 text-base font-medium text-foreground">
            &ldquo;{founder.quote}&rdquo;
          </blockquote>
        )}
        <div className="mt-8 flex flex-wrap gap-2">
          {founder.focus.slice(0, 6).map((item) => (
            <span key={item} className={badgeClass()}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export function AboutContent({
  stats: _stats,
}: {
  stats: {
    meetingsHosted: number;
    registeredUsers: number;
    countriesReached: number | null;
    hoursConnected: number;
  } | null;
}) {
  const content = BOLD_ABOUT_CONTENT;

  return (
    <div className="flex min-h-full min-w-0 flex-col overflow-x-clip">
      <MarketingHeader active="about" />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <p className={ui.eyebrow}>
            <Sparkles className="h-3.5 w-3.5" />
            {content.hero.eyebrow}
          </p>
          <h1 className={cn('mt-8 max-w-4xl', ui.pageTitle)}>
            We built Bold because showing up online shouldn&apos;t feel like a compromise
          </h1>
          <p className={cn('mt-6 max-w-2xl', ui.pageSubtitle, 'sm:text-xl')}>
            {content.hero.subtitle}
          </p>
          <blockquote className="mt-10 max-w-2xl border-l-2 border-foreground/20 pl-6 text-lg font-medium leading-relaxed text-foreground">
            &ldquo;Every coach, educator, and team deserves a meeting experience that feels as
            intentional as the work they do inside it.&rdquo;
          </blockquote>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="h-14 px-8">
                Start Free Meeting
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/#pricing">
              <Button variant="secondary" size="lg" className="h-14 px-8">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className={ui.sectionTitle}>Why Bold Exists</h2>
          <div className="mt-10 space-y-6 text-lg leading-relaxed text-muted-foreground">
            {content.story.paragraphs.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
          </div>
          <p className="mt-8 text-base font-medium text-foreground">
            That frustration — fragmented tools, surprise bills, downloads that never work on
            guest devices — is exactly what we set out to eliminate.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60 bg-[var(--badge-bg)]/40 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-6">
          <div className={ui.iconWell}>
            <Target className="h-5 w-5" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            {content.mission.title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{content.mission.body}</p>
        </div>
      </section>

      <section className="border-b border-border/60 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className={ui.sectionTitle}>Who We Serve</h2>
          <p className={cn(ui.sectionSubtitle, 'max-w-2xl')}>
            One platform for professionals who need to show up, connect, and grow.
          </p>
          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {content.audiences.map((audience) => {
              const Icon = AUDIENCE_ICONS[audience.id as keyof typeof AUDIENCE_ICONS] ?? Users;
              return (
                <div key={audience.id} className={cn(cardClass({ interactive: true }), 'p-8 sm:p-10')}>
                  <div className={ui.iconWell}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight">{audience.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{audience.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <div className={ui.iconWell}>
                <Laptop className="h-5 w-5" />
              </div>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
                {content.browserFirst.title}
              </h2>
              <p className="mt-4 text-lg font-medium text-foreground">{content.browserFirst.subtitle}</p>
              <div className="mt-8 space-y-5 text-muted-foreground">
                {content.browserFirst.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>
            <ul className="space-y-4">
              {content.browserFirst.points.map((point) => (
                <li
                  key={point}
                  className={cn(cardClass({ bordered: true }), 'flex items-start gap-3 p-5 text-sm')}
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                  <span className="text-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className={ui.sectionTitle}>Meet the Executive Team</h2>
            <p className={ui.sectionSubtitle}>
              The visionaries building reliable browser-based communication for the next generation
              of professional meetings.
            </p>
          </div>
          <div className="space-y-24">
            {BOLD_FOUNDERS.map((founder, index) => (
              <FounderCard key={founder.id} founder={founder} reverse={index % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-[var(--badge-bg)]/40 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className={cn(ui.iconWell, 'mx-auto')}>
            <Globe className="h-5 w-5" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            {content.futureVision.title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{content.futureVision.body}</p>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {content.futureVision.highlights.map((item) => (
              <span key={item} className={badgeClass('px-5 py-2.5 text-sm')}>
                {item}
              </span>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/roadmap" className={ui.link}>
              Explore the full roadmap →
            </Link>
          </div>
        </div>
      </section>

      <PageCta
        title={content.cta.title}
        subtitle={content.cta.subtitle}
        secondaryHref="/contact"
        secondaryLabel="Talk to us"
      />

      <MarketingFooter />
    </div>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Check,
  Globe,
  GraduationCap,
  Sparkles,
  Target,
  Users,
  Video,
} from 'lucide-react';
import type { FounderProfile } from '@boldmeet/shared';
import { BOLDMEET_ABOUT_CONTENT, BOLDMEET_FOUNDERS } from '@boldmeet/shared';
import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { Button } from '@/components/ui/Button';
import { formatHoursConnected, formatStatValue } from '@/lib/platform-stats';
import { badgeClass, cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

const AUDIENCE_ICONS = {
  coaches: Users,
  educators: GraduationCap,
  agencies: Briefcase,
  teams: Users,
} as const;

function FounderCard({ founder, reverse }: { founder: FounderProfile; reverse?: boolean }) {
  return (
    <article
      className={cn(
        'group grid items-start gap-10 lg:grid-cols-2 lg:gap-16',
        reverse && 'lg:[&>*:first-child]:order-2',
      )}
    >
      <div className="relative mx-auto w-full max-w-sm lg:mx-0">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-[var(--shadow-elevated)]">
          <Image
            src={founder.photoWebp ?? founder.photo}
            alt={founder.name}
            width={400}
            height={400}
            className="aspect-square w-full object-cover"
            style={{ objectPosition: founder.photoFocus ?? 'center' }}
            priority={founder.id === 'sambhav-kumar'}
          />
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {founder.role}
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{founder.name}</h3>

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

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {founder.focusLabel}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {founder.focus.map((item) => (
              <span key={item} className={badgeClass()}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {founder.social.linkedin && (
            <a
              href={founder.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:shadow-[var(--shadow-soft)]"
            >
              LinkedIn
            </a>
          )}
          {founder.social.website && (
            <a
              href={founder.social.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:shadow-[var(--shadow-soft)]"
            >
              <Globe className="h-4 w-4" />
              Website
            </a>
          )}
          {founder.social.x && (
            <a
              href={founder.social.x}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:shadow-[var(--shadow-soft)]"
            >
              Profile
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function PlatformMockup() {
  return (
    <div className="relative mx-auto mt-16 w-full max-w-4xl animate-v3-fade-up">
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-[#0a0a0b] shadow-[var(--shadow-elevated)]">
        <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="ml-3 text-xs text-white/50">BoldMeet — Team Standup</span>
        </div>
        <div className="grid aspect-video grid-cols-3 gap-2 p-3 sm:gap-3 sm:p-4">
          {['Host', 'Participant', 'Presenter'].map((label, i) => (
            <div
              key={label}
              className={cn(
                'relative flex items-end overflow-hidden rounded-xl bg-white/5 p-3',
                i === 0 && 'col-span-3 row-span-1 sm:col-span-2 sm:row-span-2',
              )}
            >
              <span className="relative text-xs font-medium text-white/80">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-black/30 px-4 py-3">
          {['Mic', 'Camera', 'Share', 'Chat'].map((control) => (
            <span
              key={control}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70"
            >
              {control}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AboutContent({
  stats,
}: {
  stats: {
    meetingsHosted: number;
    registeredUsers: number;
    countriesReached: number | null;
    hoursConnected: number;
  } | null;
}) {
  const content = BOLDMEET_ABOUT_CONTENT;

  const trustMetrics = [
    { label: 'Meetings Hosted', value: formatStatValue(stats?.meetingsHosted), icon: Video },
    { label: 'Registered Users', value: formatStatValue(stats?.registeredUsers), icon: Users },
    { label: 'Countries Reached', value: formatStatValue(stats?.countriesReached), icon: Globe },
    {
      label: 'Hours Connected',
      value: formatHoursConnected(stats?.hoursConnected),
      icon: Calendar,
    },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader active="about" />

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <p className={ui.eyebrow}>
            <Sparkles className="h-3.5 w-3.5" />
            {content.hero.eyebrow}
          </p>
          <h1 className={cn('mt-8 max-w-4xl', ui.pageTitle)}>{content.hero.title}</h1>
          <p className={cn('mt-6 max-w-3xl', ui.pageSubtitle, 'sm:text-xl')}>
            {content.hero.subtitle}
          </p>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="h-14 w-full px-8 text-base sm:w-auto">
                Start Free Meeting
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/#pricing">
              <Button variant="secondary" size="lg" className="h-14 w-full px-8 text-base sm:w-auto">
                Explore Features
              </Button>
            </Link>
          </div>
          <PlatformMockup />
        </div>
      </section>

      <section className="border-b border-border py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className={ui.sectionTitle}>Why BoldMeet Exists</h2>
            <div className="mt-10 space-y-6 text-left text-base leading-relaxed text-muted-foreground sm:text-lg">
              {content.story.paragraphs.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[var(--badge-bg)]/50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className={cn(cardClass({ bordered: true }), 'mx-auto max-w-3xl p-10 sm:p-12')}>
            <div className={ui.iconWell}>
              <Target className="h-5 w-5" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
              {content.mission.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {content.mission.body}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Who BoldMeet Is For
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            One platform for the professionals who need to show up, connect, and grow.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {content.audiences.map((audience) => {
              const Icon = AUDIENCE_ICONS[audience.id as keyof typeof AUDIENCE_ICONS] ?? Users;
              return (
                <div
                  key={audience.id}
                  className={cn(cardClass({ bordered: true, interactive: true }), 'p-8')}
                >
                  <div className={ui.iconWell}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{audience.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {audience.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            What Makes BoldMeet Different
          </h2>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.differentiators.map((item) => (
              <div
                key={item}
                className={cn(
                  cardClass({ bordered: true, interactive: true }),
                  'flex items-start gap-3 p-5',
                )}
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-[var(--badge-bg)]">
                  <Check className="h-3.5 w-3.5 text-foreground" />
                </span>
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className={ui.sectionTitle}>Meet the Founders</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              The team behind BoldMeet — building reliable virtual communication for modern
              professionals worldwide.
            </p>
          </div>
          <div className="space-y-24">
            {BOLDMEET_FOUNDERS.map((founder, index) => (
              <FounderCard key={founder.id} founder={founder} reverse={index % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[var(--badge-bg)]/50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Our Values
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.values.map((value) => (
              <div key={value.title} className={cn(cardClass({ bordered: true }), 'p-6')}>
                <h3 className="text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Built for Modern Professionals
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustMetrics.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className={cn(cardClass({ bordered: true }), 'p-6 text-center')}
              >
                <div className={cn(ui.iconWell, 'mx-auto')}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-3xl font-semibold tracking-tight">{value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className={ui.sectionTitle}>What&apos;s Next</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            We&apos;re building the future of meetings, webinars, and AI-powered collaboration.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {content.roadmap.map((item) => (
              <span key={item} className={badgeClass('px-5 py-2.5 text-sm')}>
                {item}
              </span>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/roadmap" className={ui.link}>
              View full product roadmap →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className={ui.sectionTitle}>{content.cta.title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{content.cta.subtitle}</p>
          <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="h-14 w-full px-8 sm:w-auto">
                Start Free
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary" size="lg" className="h-14 w-full px-8 sm:w-auto">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

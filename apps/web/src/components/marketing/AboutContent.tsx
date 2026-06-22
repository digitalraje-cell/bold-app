'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Check,
  Globe,
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
import { cn } from '@/lib/utils';

function FounderCard({ founder, reverse }: { founder: FounderProfile; reverse?: boolean }) {
  return (
    <article
      className={cn(
        'group grid items-start gap-8 lg:grid-cols-2 lg:gap-12',
        reverse && 'lg:[&>*:first-child]:order-2',
      )}
    >
      <div className="relative mx-auto w-full max-w-sm lg:mx-0">
        <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-primary/5 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-xl">
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
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">{founder.role}</p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{founder.name}</h3>

        <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {founder.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>

        {founder.quote && (
          <blockquote className="mt-6 border-l-4 border-primary/40 pl-4 text-sm italic text-foreground/90 sm:text-base">
            &ldquo;{founder.quote}&rdquo;
          </blockquote>
        )}

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {founder.focusLabel}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {founder.focus.map((item) => (
              <span
                key={item}
                className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {founder.social.linkedin && (
            <a
              href={founder.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="text-sm font-bold text-primary">in</span>
              LinkedIn
            </a>
          )}
          {founder.social.website && (
            <a
              href={founder.social.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-primary/5"
            >
              <Globe className="h-4 w-4 text-primary" />
              Website
            </a>
          )}
          {founder.social.x && (
            <a
              href={founder.social.x}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="text-sm font-bold text-primary">𝕏</span>
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
    <div className="relative mx-auto mt-12 w-full max-w-4xl animate-[meeting-fade-in_0.6s_ease-out]">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/5 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-slate-900 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 bg-slate-950/80 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-500/80" />
          <span className="h-3 w-3 rounded-full bg-green-500/80" />
          <span className="ml-3 text-xs text-slate-400">BoldMeet — Team Standup</span>
        </div>
        <div className="grid aspect-video grid-cols-3 gap-2 p-3 sm:gap-3 sm:p-4">
          {['Host', 'Participant', 'Presenter'].map((label, i) => (
            <div
              key={label}
              className={cn(
                'relative flex items-end overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 p-3',
                i === 0 && 'col-span-3 row-span-1 sm:col-span-2 sm:row-span-2',
              )}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.35),transparent_55%)]" />
              <span className="relative text-xs font-medium text-white/90">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 border-t border-white/10 bg-slate-950/60 px-4 py-3">
          {['Mic', 'Camera', 'Share', 'Chat'].map((control) => (
            <span
              key={control}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80"
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

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            {content.hero.eyebrow}
          </p>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {content.hero.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {content.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
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

      {/* Story */}
      <section className="border-b border-border bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{content.story.title}</h2>
            <div className="mt-8 space-y-5 text-left text-base leading-relaxed text-muted-foreground sm:text-lg">
              {content.story.paragraphs.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm transition hover:shadow-md">
            <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">{content.mission.title}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{content.mission.body}</p>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-surface p-8 shadow-sm transition hover:shadow-md">
            <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">{content.vision.title}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{content.vision.body}</p>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="border-y border-border bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            What Makes BoldMeet Different
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.differentiators.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/30 hover:shadow-md"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Meet the Founders</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              The team behind BoldMeet — building reliable virtual communication for modern
              professionals worldwide.
            </p>
          </div>
          <div className="space-y-20">
            {BOLDMEET_FOUNDERS.map((founder, index) => (
              <FounderCard key={founder.id} founder={founder} reverse={index % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Our Values</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Built for Modern Professionals
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Trusted by teams, coaches, educators, and businesses connecting across borders.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustMetrics.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-border bg-gradient-to-b from-surface to-muted/30 p-6 text-center"
              >
                <div className="mx-auto mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="border-t border-border bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            What&apos;s Next
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            We&apos;re building the future of meetings, webinars, and AI-powered collaboration.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {content.roadmap.map((item) => (
              <span
                key={item}
                className="rounded-full border border-primary/20 bg-primary/5 px-5 py-2.5 text-sm font-medium text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/roadmap" className="text-sm font-semibold text-primary hover:underline">
              View full product roadmap →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{content.cta.title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{content.cta.subtitle}</p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
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

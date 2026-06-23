import { Radio, Smartphone, Users, Video } from 'lucide-react';
import { cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

const PILLARS = [
  {
    icon: Video,
    title: 'Meetings',
    description: 'Host HD meetings from your browser.',
  },
  {
    icon: Users,
    title: 'Webinars',
    description: 'Run presentations and training sessions.',
  },
  {
    icon: Radio,
    title: 'YouTube Live',
    description: 'Broadcast directly to your audience.',
  },
  {
    icon: Smartphone,
    title: 'PWA App',
    description: 'Install on desktop and mobile with one click.',
  },
] as const;

export function DifferentiatorSection({ className }: { className?: string }) {
  return (
    <section className={cn('px-6 py-20 sm:py-28', className)}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className={ui.eyebrow}>One platform</p>
          <h2 className={cn('mt-5 text-balance', ui.sectionTitle)}>
            Why use 3 tools when one is enough?
          </h2>
          <p className={cn('mt-4 text-balance', ui.sectionSubtitle)}>
            Bold is not another meeting app. It is your{' '}
            <span className="font-semibold text-foreground">
              meeting + webinar + streaming platform
            </span>{' '}
            — built for teams that present, collaborate, and broadcast without switching tools.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className={cn(
                cardClass({ interactive: true }),
                'group relative overflow-hidden p-7 text-left',
              )}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--accent-purple-light)]/10 via-transparent to-[var(--accent-purple-dark)]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <div className={cn(ui.iconWell, 'mb-5 h-12 w-12')}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

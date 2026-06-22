import Link from 'next/link';
import { Headphones, Mail, Handshake } from 'lucide-react';
import { ContactForm } from '@/components/marketing/ContactForm';
import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { PageCta } from '@/components/marketing/PageCta';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { getPublicDisplayDomain } from '@/lib/public-display';
import { cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

const CONTACT_CHANNELS = [
  {
    icon: Headphones,
    title: 'Support',
    description: 'Account access, meetings, OTP login, and technical issues.',
    email: LEGAL_CONFIG.supportEmail,
    cta: 'Email support',
  },
  {
    icon: Mail,
    title: 'Sales',
    description: 'Pro plans, team rollout, and product questions.',
    email: LEGAL_CONFIG.businessEmail,
    cta: 'Email sales',
  },
  {
    icon: Handshake,
    title: 'Partnerships',
    description: 'Enterprise, education, integrations, and strategic collaborations.',
    email: LEGAL_CONFIG.businessEmail,
    cta: 'Discuss partnership',
  },
] as const;

const FAQ = [
  {
    q: 'How quickly will I hear back?',
    a: `We respond to most inquiries within ${LEGAL_CONFIG.responseTime.toLowerCase()}.`,
  },
  {
    q: 'I did not receive my login code',
    a: 'Check spam, confirm your email address, and wait a minute before requesting a new OTP from the login page.',
  },
  {
    q: 'How do I upgrade to Pro or request a refund?',
    a: 'Sign in and visit Billing, or email support with your Razorpay payment ID and account email.',
  },
  {
    q: 'Can guests join without an account?',
    a: 'Yes. Hosts can share a meeting link; guests join directly in the browser when the host allows it.',
  },
] as const;

export function ContactContent() {
  const { companyName, productName, supportEmail, businessEmail, responseTime } = LEGAL_CONFIG;

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />

      <section className="border-b border-border/60 bg-[var(--badge-bg)]/30 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className={ui.eyebrow}>Contact</p>
          <h1 className={cn('mt-5 max-w-3xl', ui.pageTitle)}>Contact {productName}</h1>
          <p className={cn('mt-4 max-w-2xl', ui.pageSubtitle)}>
            Support, billing, sales, and partnerships — we&apos;re here to help you get the most from
            professional browser-based meetings.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Support', 'Billing', 'Sales', 'Partnerships'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
          {CONTACT_CHANNELS.map(({ icon: Icon, title, description, email, cta }) => (
            <div key={title} className={cn(cardClass({ interactive: true }), 'flex flex-col p-7')}>
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--badge-bg)]">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              <a
                href={`mailto:${email}`}
                className="mt-6 inline-flex text-sm font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {cta} →
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 px-6 py-14 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-5 lg:gap-14">
          <div className={cn(cardClass({ bordered: true }), 'p-8 sm:p-10 lg:col-span-3')}>
            <h2 className="text-xl font-semibold tracking-tight">Send us a message</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fill out the form and our team will get back to you.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className={cn(cardClass(), 'p-8')}>
              <h2 className="text-lg font-semibold">Company information</h2>
              <dl className="mt-6 space-y-5 text-sm">
                <div>
                  <dt className="font-medium text-muted-foreground">Company</dt>
                  <dd className="mt-1 font-semibold">{companyName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Product</dt>
                  <dd className="mt-1 font-semibold">{productName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Website</dt>
                  <dd className="mt-1 font-semibold">{getPublicDisplayDomain()}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Support email</dt>
                  <dd className="mt-1">
                    <a href={`mailto:${supportEmail}`} className={ui.link}>
                      {supportEmail}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Business email</dt>
                  <dd className="mt-1">
                    <a href={`mailto:${businessEmail}`} className={ui.link}>
                      {businessEmail}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Response time</dt>
                  <dd className="mt-1 font-semibold">{responseTime}</dd>
                </div>
              </dl>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              For legal documents see{' '}
              <Link href="/terms" className={ui.link}>
                Terms
              </Link>
              ,{' '}
              <Link href="/privacy" className={ui.link}>
                Privacy
              </Link>
              , and{' '}
              <Link href="/refund" className={ui.link}>
                Refund Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-[var(--badge-bg)]/25 px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
          <div className="mt-10 space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className={cn(cardClass({ bordered: true }), 'p-6')}>
                <h3 className="font-semibold text-foreground">{q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PageCta title="Start your first meeting" />

      <MarketingFooter />
    </div>
  );
}

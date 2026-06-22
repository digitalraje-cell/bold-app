import Link from 'next/link';
import { BoldLogo } from '@/components/brand/BoldLogo';
import { LEGAL_CONFIG } from '@/lib/legal-config';

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms' },
  { href: '/refund', label: 'Refund Policy' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/contact', label: 'Contact' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/roadmap', label: 'Roadmap' },
] as const;

export function LegalPageFooter() {
  return (
    <footer className="border-t border-border bg-surface py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <BoldLogo href="/" size="md" showTagline />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Legal center for {LEGAL_CONFIG.companyName}. Policies, privacy, billing, and support
              information for the {LEGAL_CONFIG.productName} meeting platform.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              © {new Date().getFullYear()} {LEGAL_CONFIG.companyName}
            </p>
          </div>

          <nav aria-label="Legal footer" className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

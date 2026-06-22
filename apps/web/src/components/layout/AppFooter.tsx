import Link from 'next/link';
import { BoldLogo } from '@/components/brand/BoldLogo';
import { LEGAL_CONFIG } from '@/lib/legal-config';

export function AppFooter() {
  return (
    <footer className="border-t border-border px-6 py-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <BoldLogo href="/" size="xs" variant="icon" />
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-primary">
            Terms
          </Link>
          <Link href="/billing" className="hover:text-primary">
            Billing
          </Link>
          <Link href="/contact" className="hover:text-primary">
            Contact
          </Link>
        </nav>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground sm:text-left">
        © {new Date().getFullYear()} {LEGAL_CONFIG.companyName} · {LEGAL_CONFIG.productName}
      </p>
    </footer>
  );
}

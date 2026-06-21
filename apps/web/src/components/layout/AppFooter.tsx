import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legal-config';

export function AppFooter() {
  return (
    <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
        <Link href="/billing" className="hover:text-foreground">
          Billing
        </Link>
        <Link href="/contact" className="hover:text-foreground">
          Contact
        </Link>
      </nav>
      <p className="mt-2">
        © {new Date().getFullYear()} {LEGAL_CONFIG.companyName} · {LEGAL_CONFIG.productName}
      </p>
    </footer>
  );
}

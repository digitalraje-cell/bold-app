import { LoginForm } from '@/components/auth/LoginForm';
import { BoldLogo } from '@/components/brand/BoldLogo';
import { BRAND } from '@/lib/brand';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-full">
      {/* Brand panel — desktop */}
      <aside className="relative hidden w-[45%] max-w-xl flex-col justify-between overflow-hidden bg-brand-navy p-10 text-white lg:flex xl:max-w-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(37,99,235,0.35),_transparent_55%)]" />
        <div className="relative">
          <BoldLogo theme="dark" size="lg" showTagline />
        </div>
        <div className="relative space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            Professional meetings,
            <span className="block text-brand-accent">right in your browser.</span>
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-slate-300">
            HD video, screen sharing, host controls, and Pro features — without downloading an app.
          </p>
        </div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} Lifetop Academy</p>
      </aside>

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4 lg:border-none lg:px-10 lg:pt-10">
          <BoldLogo href="/" size="sm" className="lg:hidden" />
          <Link
            href="/"
            className="ml-auto text-sm font-medium text-muted-foreground transition hover:text-primary lg:ml-0"
          >
            ← Back to home
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:py-16">
          <LoginForm />
        </div>
        <p className="pb-6 text-center text-xs text-muted-foreground lg:hidden">{BRAND.tagline}</p>
      </div>
    </div>
  );
}

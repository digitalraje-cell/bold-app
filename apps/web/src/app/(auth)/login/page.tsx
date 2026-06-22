import { LoginForm } from '@/components/auth/LoginForm';
import { MarketingFooter, MarketingHeader } from '@/components/marketing/MarketingHeader';
import { cardClass, ui } from '@/lib/ui';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-16 sm:py-24">
        <div className={cn(cardClass(), 'w-full max-w-md p-10 sm:p-12')}>
          <p className={cn(ui.eyebrow, 'mb-8 justify-center')}>Sign in</p>
          <LoginForm />
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

import { LoginForm } from '@/components/auth/LoginForm';
import { cardClass } from '@/lib/ui';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16 sm:py-24">
      <div className={cn(cardClass(), 'w-full max-w-md p-9 sm:p-11')}>
        <LoginForm />
      </div>
    </div>
  );
}

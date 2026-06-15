import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { VerifyAccountForm } from '@/components/auth/VerifyAccountForm';

export default async function VerifyPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.isVerified) redirect('/dashboard');

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-12">
      <VerifyAccountForm />
    </div>
  );
}

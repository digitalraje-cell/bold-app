import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { VerifyAccountForm } from '@/components/auth/VerifyAccountForm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function VerifyPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=%2Fverify');
  if (session.user.isVerified) redirect('/dashboard');

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-12">
      <VerifyAccountForm />
    </div>
  );
}

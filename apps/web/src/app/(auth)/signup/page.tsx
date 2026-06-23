import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AUTHENTICATED_HOME } from '@/lib/auth-routes';

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect(AUTHENTICATED_HOME);
  }

  redirect('/login');
}

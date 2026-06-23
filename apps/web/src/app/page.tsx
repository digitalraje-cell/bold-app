import { redirect } from 'next/navigation';
import { PwaJoinHome } from '@/components/pwa/PwaJoinHome';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/dashboard');
  }

  return <PwaJoinHome />;
}

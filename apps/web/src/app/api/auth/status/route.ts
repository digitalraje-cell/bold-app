import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  const hasSecret = Boolean(
    process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  );
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || null;

  let sessionActive = false;
  try {
    const session = await auth();
    sessionActive = Boolean(session?.user?.id);
  } catch {
    sessionActive = false;
  }

  return NextResponse.json({
    status: 'ok',
    auth: {
      secretConfigured: hasSecret,
      databaseConfigured: hasDatabase,
      authUrl,
      sessionActive,
    },
  });
}

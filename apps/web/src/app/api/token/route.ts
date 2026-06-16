import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resolveJwtSecret(): Uint8Array | null {
  const secret =
    process.env.JWT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (!secret) {
    return null;
  }

  return new TextEncoder().encode(secret);
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secret = resolveJwtSecret();
  if (!secret) {
    return NextResponse.json({ error: 'Server auth misconfigured' }, { status: 500 });
  }

  const token = await new SignJWT({
    sub: session.user.id,
    email: session.user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);

  return NextResponse.json({ token });
}

import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET || process.env.AUTH_SECRET);

  const token = await new SignJWT({
    sub: session.user.id,
    email: session.user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);

  return NextResponse.json({ token });
}

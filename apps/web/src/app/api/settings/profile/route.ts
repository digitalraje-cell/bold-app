import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const avatarUrlRaw = body.avatarUrl === null || body.avatarUrl === '' ? null : String(body.avatarUrl || '').trim();

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  if (avatarUrlRaw && !/^https?:\/\/.+/i.test(avatarUrlRaw)) {
    return NextResponse.json({ error: 'Profile photo must be a valid URL' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      avatarUrl: avatarUrlRaw,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json({ user });
}

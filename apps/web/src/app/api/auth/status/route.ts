import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveAdminAccess } from '@/lib/admin-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Self-only admin access audit for the signed-in user. */
export async function GET() {
  const hasSecret = Boolean(
    process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  );
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || null;

  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  const sessionActive = Boolean(session?.user?.id);
  let audit = null;

  if (sessionActive && session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        createdAt: true,
      },
    });

    const access = resolveAdminAccess(dbUser, session.user);

    audit = {
      database: dbUser
        ? {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            plan: dbUser.subscriptionPlan,
            created_at: dbUser.createdAt.toISOString(),
          }
        : null,
      session: {
        id: session.user.id,
        email: session.user.email ?? null,
        role: session.user.role ?? null,
        plan: session.user.subscriptionPlan ?? null,
      },
      access: {
        required: 'ADMIN or SUPER_ADMIN (isPlatformAdmin)',
        resolved_role: access.resolvedRole,
        allowed: access.allowed,
        denial_reason: access.allowed
          ? null
          : dbUser
            ? `DB role=${dbUser.role}, session role=${session.user.role ?? 'USER'} — neither resolves to admin`
            : 'No matching user row for session id in database',
      },
    };
  }

  return NextResponse.json({
    status: 'ok',
    auth: {
      secretConfigured: hasSecret,
      databaseConfigured: hasDatabase,
      authUrl,
      sessionActive,
    },
    audit,
  });
}

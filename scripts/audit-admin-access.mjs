#!/usr/bin/env node
/**
 * Audit + promote super admin user.
 * Usage: DATABASE_URL="postgresql://..." node scripts/audit-admin-access.mjs [email]
 */
import { PrismaClient } from '@prisma/client';

const EMAIL = (process.argv[2] || 'digitalraje@gmail.com').trim().toLowerCase();
const SUPER_ADMIN_EMAIL = 'digitalraje@gmail.com';

function resolvePlatformRole(role, email) {
  if ((email ?? '').trim().toLowerCase() === SUPER_ADMIN_EMAIL) return 'SUPER_ADMIN';
  return role ?? 'USER';
}

function isPlatformAdmin(role, email) {
  const resolved = resolvePlatformRole(role, email);
  return resolved === 'ADMIN' || resolved === 'SUPER_ADMIN';
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    let user = await prisma.user.findFirst({
      where: { email: { equals: EMAIL, mode: 'insensitive' } },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        createdAt: true,
      },
    });

    console.log('=== BEFORE ===');
    if (!user) {
      console.log(JSON.stringify({ found: false, email: EMAIL }, null, 2));
    } else {
      console.log(
        JSON.stringify(
          {
            found: true,
            id: user.id,
            email: user.email,
            role: user.role,
            plan: user.subscriptionPlan,
            created_at: user.createdAt.toISOString(),
            resolved_role: resolvePlatformRole(user.role, user.email),
            is_platform_admin: isPlatformAdmin(user.role, user.email),
          },
          null,
          2,
        ),
      );
    }

    if (user && user.role !== 'SUPER_ADMIN') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SUPER_ADMIN' },
        select: {
          id: true,
          email: true,
          role: true,
          subscriptionPlan: true,
          createdAt: true,
        },
      });
      console.log('\n=== PROMOTED TO SUPER_ADMIN ===');
    } else if (!user) {
      console.log('\n=== NO USER ROW — cannot promote (sign in once to create account) ===');
    } else {
      console.log('\n=== ALREADY SUPER_ADMIN IN DATABASE ===');
    }

    if (user) {
      console.log(
        JSON.stringify(
          {
            id: user.id,
            email: user.email,
            role: user.role,
            plan: user.subscriptionPlan,
            created_at: user.createdAt.toISOString(),
            resolved_role: resolvePlatformRole(user.role, user.email),
            is_platform_admin: isPlatformAdmin(user.role, user.email),
          },
          null,
          2,
        ),
      );
    }

    console.log('\n=== ACCESS RULES ===');
    console.log('/admin requires: ADMIN or SUPER_ADMIN (isPlatformAdmin)');
    console.log('Email fallback:', SUPER_ADMIN_EMAIL, '→ SUPER_ADMIN even if DB role is USER');
    console.log('After DB promotion: sign out and sign back in to refresh JWT session.role');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

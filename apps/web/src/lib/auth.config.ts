import type { NextAuthConfig } from 'next-auth';

function resolveAuthSecret(): string | undefined {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET
  );
}

/**
 * Edge-safe NextAuth config — no Prisma imports.
 * Used by middleware; full auth with DB lives in auth.ts (Node.js only).
 */
export const authConfig = {
  secret: resolveAuthSecret(),
  providers: [],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
      }

      if (user && 'isVerified' in user) {
        token.isVerified = Boolean(user.isVerified);
      }

      if (user && 'subscriptionPlan' in user) {
        token.subscriptionPlan = user.subscriptionPlan;
      }

      if (user && 'role' in user) {
        token.role = user.role;
      }

      if (trigger === 'update' && (session as { isVerified?: boolean })?.isVerified) {
        token.isVerified = true;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.isVerified = Boolean(token.isVerified);
        session.user.subscriptionPlan = (token.subscriptionPlan as string) || 'FREE';
        session.user.role = (token.role as string) || 'USER';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

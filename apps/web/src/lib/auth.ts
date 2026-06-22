import NextAuth, { type NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { prisma } from './prisma';
import { verifyAuthOtp } from './otp-service';
import { logUserActivity } from './activity-log';

if (process.env.NEXT_RUNTIME !== 'edge') {
  console.log('[auth] runtime = nodejs');
}

function resolveAuthSecret(): string | undefined {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET
  );
}

const authSecret = resolveAuthSecret();

if (!authSecret && process.env.NODE_ENV === 'production') {
  console.error(
    '[auth] Missing AUTH_SECRET (or NEXTAUTH_SECRET). Sign-in will fail in production.',
  );
}

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.error(
    '[auth] Missing DATABASE_URL on web service. OTP sign-in requires Postgres.',
  );
}

const providers: NextAuthConfig['providers'] = [
  Credentials({
    id: 'credentials',
    name: 'Email OTP',
    credentials: {
      email: { label: 'Email', type: 'email' },
      otp: { label: 'OTP', type: 'text' },
    },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined;
      const otp = credentials?.otp as string | undefined;

      if (!email?.trim() || !otp?.trim()) {
        return null;
      }

      try {
        const result = await verifyAuthOtp(email, otp);
        if (!result.ok) {
          return null;
        }

        const user = result.user;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
          subscriptionPlan: user.subscriptionPlan,
          role: user.role,
        };
      } catch (error) {
        console.error('[auth] OTP authorize failed:', error);
        return null;
      }
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  providers,
  events: {
    async signOut(message) {
      if ('token' in message && message.token?.id) {
        await logUserActivity(message.token.id as string, 'LOGOUT');
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      token = authConfig.callbacks!.jwt!({ token, user, trigger, session });

      if (process.env.NEXT_RUNTIME === 'edge') {
        return token;
      }

      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              isVerified: true,
              subscriptionPlan: true,
              subscriptionExpiresAt: true,
              role: true,
            },
          });
          token.isVerified = dbUser?.isVerified ?? false;
          token.subscriptionPlan = dbUser?.subscriptionPlan ?? 'FREE';
          token.role = dbUser?.role ?? 'USER';
          if (
            dbUser?.subscriptionExpiresAt &&
            dbUser.subscriptionExpiresAt < new Date()
          ) {
            token.subscriptionPlan = 'FREE';
          }
        } catch (error) {
          console.error('[auth] JWT callback DB lookup failed:', error);
        }
      }

      return token;
    },
  },
});

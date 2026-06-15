import NextAuth, { type NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

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
    '[auth] Missing DATABASE_URL on web service. Credentials sign-in requires Postgres.',
  );
}

const providers: NextAuthConfig['providers'] = [
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = credentials.email as string;
      const password = credentials.password as string;

      try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        };
      } catch (error) {
        console.error('[auth] Credentials authorize failed:', error);
        return null;
      }
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers,
  events: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: {
              isVerified: true,
              verifiedAt: new Date(),
              emailVerified: new Date(),
            },
          });
        } catch (error) {
          console.error('[auth] Google sign-in profile update failed:', error);
        }
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
      }

      if (trigger === 'update' && (session as { isVerified?: boolean })?.isVerified) {
        token.isVerified = true;
      }

      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              isVerified: true,
              subscriptionPlan: true,
              subscriptionExpiresAt: true,
            },
          });
          token.isVerified = dbUser?.isVerified ?? false;
          token.subscriptionPlan = dbUser?.subscriptionPlan ?? 'FREE';
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
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.isVerified = Boolean(token.isVerified);
        session.user.subscriptionPlan = (token.subscriptionPlan as string) || 'FREE';
      }
      return session;
    },
  },
});

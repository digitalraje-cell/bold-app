import NextAuth, { type NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

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
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers,
  events: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        await prisma.user.update({
          where: { email: user.email },
          data: {
            isVerified: true,
            verifiedAt: new Date(),
            emailVerified: new Date(),
          },
        });
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
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isVerified: true, subscriptionPlan: true, subscriptionExpiresAt: true },
        });
        token.isVerified = dbUser?.isVerified ?? false;
        token.subscriptionPlan = dbUser?.subscriptionPlan ?? 'FREE';
        if (
          dbUser?.subscriptionExpiresAt &&
          dbUser.subscriptionExpiresAt < new Date()
        ) {
          token.subscriptionPlan = 'FREE';
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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = ['/dashboard', '/settings', '/meetings', '/verify'];
      const hostOnlyPaths = ['/meetings/create'];

      const isProtected = protectedPaths.some((path) =>
        nextUrl.pathname.startsWith(path),
      );

      if (isProtected && !isLoggedIn) {
        return false;
      }

      const isHostOnly = hostOnlyPaths.some((path) =>
        nextUrl.pathname.startsWith(path),
      );

      if (isHostOnly && isLoggedIn && !auth?.user?.isVerified) {
        return Response.redirect(new URL('/verify', nextUrl));
      }

      return true;
    },
  },
});

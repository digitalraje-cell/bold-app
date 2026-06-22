import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { PwaRegistrar } from '@/components/pwa/PwaRegistrar';
import { UserSettingsInit } from '@/components/settings/UserSettingsInit';
import { APP_CONFIG, getServerAppOrigin } from '@/lib/app-config';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Bold — Browser-based video meetings',
    template: '%s | Bold',
  },
  description:
    'Bold by Lifetop Academy — host HD video meetings, webinars, and collaborations. Free plan available. Pro from ₹299/month.',
  metadataBase: new URL(getServerAppOrigin()),
  openGraph: {
    siteName: 'Bold',
    type: 'website',
    locale: 'en_IN',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Bold',
    statusBarStyle: 'default',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <UserSettingsInit />
          <PwaRegistrar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

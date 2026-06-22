import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/providers/ClientProviders';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full min-w-0 max-w-[100vw] flex-col overflow-x-clip bg-background text-foreground">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

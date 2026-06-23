import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/providers/ClientProviders';
import { getServerAppOrigin } from '@/lib/app-config';
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
    'Bold by Lifetop Academy — host HD video meetings, webinars, and collaborations in your browser or as an installable app. Free plan available. Pro from ₹299/month.',
  metadataBase: new URL(getServerAppOrigin()),
  openGraph: {
    siteName: 'Bold',
    type: 'website',
    locale: 'en_IN',
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192.png',
  },
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
  themeColor: '#7c3aed',
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

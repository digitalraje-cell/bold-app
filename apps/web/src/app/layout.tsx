import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { UserSettingsInit } from '@/components/settings/UserSettingsInit';
import { BRAND } from '@/lib/brand';
import { APP_CONFIG, getServerAppOrigin } from '@/lib/app-config';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const siteDescription =
  'Bold by Lifetop Academy — professional browser-based video meetings. Host HD calls, collaborate with chat and screen share. Free plan available. Pro from ₹299/month.';

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: siteDescription,
  metadataBase: new URL(getServerAppOrigin()),
  applicationName: APP_CONFIG.name,
  icons: {
    icon: [{ url: BRAND.assets.favicon, type: 'image/svg+xml' }],
    apple: [{ url: BRAND.assets.appleTouchIcon, type: 'image/svg+xml' }],
  },
  openGraph: {
    siteName: BRAND.name,
    type: 'website',
    locale: 'en_IN',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: siteDescription,
    images: [
      {
        url: BRAND.assets.ogImage,
        width: 1200,
        height: 630,
        alt: `${BRAND.name} — ${BRAND.tagline}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: siteDescription,
    images: [BRAND.assets.ogImage],
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { UserSettingsInit } from '@/components/settings/UserSettingsInit';
import { APP_CONFIG, getServerAppOrigin } from '@/lib/app-config';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'BoldMeet — Browser-based video meetings',
    template: '%s | BoldMeet',
  },
  description:
    'BoldMeet by Lifetop Academy — host HD video meetings, webinars, and collaborations. Free plan available. Pro from ₹299/month.',
  metadataBase: new URL(getServerAppOrigin()),
  openGraph: {
    siteName: 'BoldMeet',
    type: 'website',
    locale: 'en_IN',
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

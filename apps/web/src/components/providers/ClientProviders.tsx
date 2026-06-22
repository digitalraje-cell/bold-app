'use client';

import { SessionProvider } from 'next-auth/react';
import { PwaUpdateManagerClient } from '@/components/pwa/PwaUpdateManagerClient';
import { UserSettingsInit } from '@/components/settings/UserSettingsInit';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus refetchInterval={5 * 60}>
      <UserSettingsInit />
      <PwaUpdateManagerClient />
      {children}
    </SessionProvider>
  );
}

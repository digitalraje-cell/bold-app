'use client';

import { signOut } from 'next-auth/react';
import { clearPendingJoin } from '@/lib/pwa-pending-join';

const GUEST_JOIN_KEY = 'boldmeet-guest-join';
const JOIN_MEDIA_PREFS_KEY = 'boldmeet-join-media';

/** Clear client-side auth-adjacent state before ending the session. */
export function clearClientAuthState() {
  if (typeof window === 'undefined') return;

  clearPendingJoin();

  try {
    sessionStorage.removeItem(GUEST_JOIN_KEY);
    sessionStorage.removeItem(JOIN_MEDIA_PREFS_KEY);
  } catch {
    // Ignore storage errors in private browsing.
  }
}

/**
 * End the NextAuth session and hard-navigate to `/` so cookies and client state reset.
 * React Query is not used in this app; SessionProvider state is cleared via signOut.
 */
export async function performSignOut() {
  clearClientAuthState();

  await signOut({ redirect: false });

  window.location.assign('/');
}

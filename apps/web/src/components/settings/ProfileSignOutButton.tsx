'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ProfileSignOutButton() {
  return (
    <Button
      type="button"
      variant="secondary"
      className="mt-6 w-full"
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign out
    </Button>
  );
}

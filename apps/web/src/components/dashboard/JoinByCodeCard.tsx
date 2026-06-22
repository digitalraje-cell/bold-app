'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { normalizeMeetingCode } from '@boldmeet/shared';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cardClass, ui } from '@/lib/ui';

export function JoinByCodeCard() {
  const router = useRouter();
  const [code, setCode] = useState('');

  function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeMeetingCode(code.trim());
    if (!normalized) return;
    router.push(`/meeting/${normalized}?entry=code`);
  }

  return (
    <form onSubmit={handleJoin} className={cardClass({ className: 'p-6 sm:p-7' })}>
      <div className={cn('mb-5', ui.iconWell)}>
        <Calendar className="h-5 w-5" />
      </div>
      <h3 className="font-semibold">Join Meeting</h3>
      <p className="mt-1 text-sm text-muted-foreground">Enter a meeting ID to join</p>
      <div className="mt-4 space-y-3">
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="725 832 1940"
          inputMode="numeric"
          autoComplete="off"
        />
        <Button type="submit" className="w-full" disabled={!normalizeMeetingCode(code.trim())}>
          Join
        </Button>
      </div>
    </form>
  );
}

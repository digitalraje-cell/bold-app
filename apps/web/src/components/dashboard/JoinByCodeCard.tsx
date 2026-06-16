'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { normalizeMeetingCode } from '@boldmeet/shared';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function JoinByCodeCard() {
  const router = useRouter();
  const [code, setCode] = useState('');

  function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeMeetingCode(code.trim());
    if (!normalized) return;
    router.push(`/meeting/${normalized}`);
  }

  return (
    <form
      onSubmit={handleJoin}
      className="rounded-2xl border border-border bg-surface p-6"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
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

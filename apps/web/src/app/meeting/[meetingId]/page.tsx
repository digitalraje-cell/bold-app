'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

export default function MeetingLobbyPage({ params }: { params: { meetingId: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(session?.user?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin() {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.meetings.join(params.meetingId, {
        displayName: displayName.trim(),
        password: password || undefined,
      }) as { admitted: boolean };

      if (result.admitted) {
        router.push(`/meeting/${params.meetingId}/room`);
      } else {
        router.push(`/meeting/${params.meetingId}/waiting`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join meeting');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {displayName?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
          <h1 className="text-2xl font-semibold">Ready to join?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your name and join the meeting
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Input
          label="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your display name"
          autoFocus
        />

        <Input
          label="Meeting password (if required)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Optional"
        />

        <Button className="w-full" size="lg" onClick={handleJoin} loading={loading}>
          Join Meeting
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="text-primary hover:underline">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

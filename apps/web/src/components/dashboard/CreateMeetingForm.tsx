'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { api } from '@/lib/api';
import { joinMeetingAndGetPath } from '@/lib/meeting-join';
import { usePermissions } from '@/hooks/usePermissions';
import { DEFAULT_MEETING_SETTINGS } from '@boldmeet/shared';

export function CreateMeetingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { plan, limits, can } = usePermissions();
  const isInstant = searchParams.get('type') !== 'schedule';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [settings, setSettings] = useState(DEFAULT_MEETING_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.isVerified) {
      setError('Verify your account to host meetings');
      router.push('/verify');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const meeting = await api.meetings.create({
        title: title || (isInstant ? 'Instant Meeting' : 'Scheduled Meeting'),
        description: description || undefined,
        password: password || undefined,
        scheduledAt: isInstant ? undefined : scheduledAt,
        settings,
      }) as { id: string; meetingCode: string };

      if (isInstant) {
        const displayName =
          session.user.name || session.user.email?.split('@')[0] || 'Host';
        try {
          const path = await joinMeetingAndGetPath(
            meeting.meetingCode,
            displayName,
            password || undefined,
          );
          router.push(path);
          return;
        } catch (joinErr) {
          console.error('[meeting] host auto-join failed', joinErr);
          router.push(`/meeting/${meeting.meetingCode}`);
          return;
        }
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting');
      setLoading(false);
    }
  }

  function toggleSetting(key: keyof typeof settings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">
          {isInstant ? 'Start Instant Meeting' : 'Schedule Meeting'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure your meeting settings before starting
          {plan === 'FREE' && limits.maxMeetingDurationMinutes && (
            <span className="block mt-1 text-xs">
              Free plan: {limits.maxMeetingDurationMinutes} min limit · up to {limits.meetingAttendeeLimit} attendees
            </span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            label="Meeting title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isInstant ? 'Instant Meeting' : 'Team Standup'}
          />

          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this meeting about?"
          />

          {!isInstant && (
            <Input
              label="Date & time"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          )}

          <Input
            label="Password (optional)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave empty for no password"
          />

          <div className="rounded-2xl border border-border p-6">
            <h3 className="mb-4 font-semibold">Feature Settings</h3>
            <div className="space-y-4">
              <Toggle
                label="Waiting room"
                description="Participants must be admitted by the host"
                checked={settings.waitingRoomEnabled}
                onChange={() => toggleSetting('waitingRoomEnabled')}
              />
              <Toggle
                label="Auto mute participants"
                description="Mute participants when they join"
                checked={settings.autoMuteParticipants}
                onChange={() => toggleSetting('autoMuteParticipants')}
              />
              <Toggle
                label="Chat"
                checked={settings.chatEnabled}
                onChange={() => toggleSetting('chatEnabled')}
              />
              <Toggle
                label="Reactions"
                checked={settings.reactionsEnabled}
                onChange={() => toggleSetting('reactionsEnabled')}
              />
              <Toggle
                label="Raise hand"
                checked={settings.raiseHandEnabled}
                onChange={() => toggleSetting('raiseHandEnabled')}
              />
              <Toggle
                label="Allow participants to share screen"
                description="When off, only the host and co-hosts can share"
                checked={settings.screenShareEnabled}
                onChange={() => toggleSetting('screenShareEnabled')}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isInstant ? 'Start Meeting' : 'Schedule Meeting'}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

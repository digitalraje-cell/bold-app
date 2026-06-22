'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HostProfileModal } from '@/components/profile/HostProfileModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { api } from '@/lib/api';
import { joinMeetingAndGetPath } from '@/lib/meeting-join';
import { usePermissions } from '@/hooks/usePermissions';
import { DEFAULT_MEETING_SETTINGS, createDefaultRegistrationFormConfig, type RegistrationFormConfig } from '@boldmeet/shared';
import { RegistrationFormBuilderModal } from '@/components/meeting/RegistrationFormBuilderModal';
import {
  hostDefaultsToMeetingSettings,
  readUserSettings,
} from '@/lib/user-settings';

function validateTitle(value: string): string | undefined {
  if (!value.trim()) return 'Meeting title is required';
  return undefined;
}

function validatePasscode(value: string): string | undefined {
  if (!value) return undefined;
  if (value.length < 6) return 'Passcode must be at least 6 characters';
  return undefined;
}

function validateScheduledAt(value: string, isInstant: boolean): string | undefined {
  if (isInstant) return undefined;
  if (!value) return 'Date and time are required';
  return undefined;
}

export function CreateMeetingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { plan, limits } = usePermissions();
  const isInstant = searchParams.get('type') !== 'schedule';
  const submittingRef = useRef(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passcode, setPasscode] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [customDuration, setCustomDuration] = useState('');
  const [settings, setSettings] = useState(DEFAULT_MEETING_SETTINGS);
  const [passcodeRequired, setPasscodeRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [hostProfileComplete, setHostProfileComplete] = useState(true);
  const [showHostProfileModal, setShowHostProfileModal] = useState(false);
  const [showRegistrationBuilder, setShowRegistrationBuilder] = useState(false);
  const [registrationFormConfig, setRegistrationFormConfig] = useState<RegistrationFormConfig>(
    createDefaultRegistrationFormConfig(),
  );
  const [profileInitial, setProfileInitial] = useState<{
    name?: string | null;
    mobile?: string | null;
    organization?: string | null;
    designation?: string | null;
    country?: string | null;
    website?: string | null;
    linkedInUrl?: string | null;
    avatarUrl?: string | null;
  }>({});
  const [touched, setTouched] = useState({
    title: false,
    passcode: false,
    scheduledAt: false,
  });

  const fieldErrors = useMemo(
    () => ({
      title: validateTitle(title),
      passcode:
        passcodeRequired && !passcode
          ? 'Passcode is required based on your host settings'
          : validatePasscode(passcode),
      scheduledAt: validateScheduledAt(scheduledAt, isInstant),
    }),
    [title, passcode, passcodeRequired, scheduledAt, isInstant],
  );

  useEffect(() => {
    const { host } = readUserSettings();
    const hostMeeting = hostDefaultsToMeetingSettings(host);
    setSettings((prev) => ({ ...prev, ...hostMeeting }));
    setPasscodeRequired(host.requireMeetingPasscode);
  }, []);

  useEffect(() => {
    void api.users
      .me()
      .then((profile) => {
        const p = profile as {
          name?: string | null;
          avatarUrl?: string | null;
          hostProfileComplete?: boolean;
          profile?: {
            mobile?: string | null;
            country?: string | null;
            organization?: string | null;
            designation?: string | null;
            website?: string | null;
            linkedInUrl?: string | null;
          };
        };
        const complete = Boolean(p.hostProfileComplete);
        setHostProfileComplete(complete);
        setShowHostProfileModal(!complete);
        setProfileInitial({
          name: p.name,
          avatarUrl: p.avatarUrl,
          mobile: p.profile?.mobile,
          country: p.profile?.country,
          organization: p.profile?.organization,
          designation: p.profile?.designation,
          website: p.profile?.website,
          linkedInUrl: p.profile?.linkedInUrl,
        });
      })
      .catch(() => {
        setHostProfileComplete(false);
        setShowHostProfileModal(true);
      })
      .finally(() => setProfileLoading(false));
  }, []);

  const isFormValid = !fieldErrors.title && !fieldErrors.passcode && !fieldErrors.scheduledAt;

  const resolvedDuration = useMemo(() => {
    if (isInstant) return undefined;
    if (durationMinutes === 'custom') {
      const custom = Number(customDuration);
      return Number.isFinite(custom) && custom >= 5 ? custom : undefined;
    }
    return Number(durationMinutes);
  }, [isInstant, durationMinutes, customDuration]);

  const endTimePreview = useMemo(() => {
    if (isInstant || !scheduledAt || !resolvedDuration) return null;
    return new Date(new Date(scheduledAt).getTime() + resolvedDuration * 60_000).toLocaleString();
  }, [isInstant, scheduledAt, resolvedDuration]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current || loading) return;

    setTouched({ title: true, passcode: true, scheduledAt: true });

    if (!isFormValid) return;

    if (!session?.user?.isVerified) {
      setError('Verify your account to host meetings');
      router.push('/verify');
      return;
    }

    if (!hostProfileComplete) {
      setShowHostProfileModal(true);
      return;
    }

    setError('');
    setLoading(true);
    submittingRef.current = true;

    const trimmedTitle = title.trim();

    try {
      const meeting = (await api.meetings.create({
        title: trimmedTitle,
        description: description.trim() || undefined,
        password: passcode || undefined,
        scheduledAt: isInstant ? undefined : scheduledAt,
        durationMinutes: resolvedDuration,
        settings,
        registrationForm: settings.registrationRequired ? registrationFormConfig : undefined,
      })) as { id: string; meetingCode: string };

      if (isInstant) {
        const displayName =
          session.user.name || session.user.email?.split('@')[0] || 'Host';
        try {
          const path = await joinMeetingAndGetPath(
            meeting.meetingCode,
            displayName,
            { password: passcode || undefined, viaDirectLink: true },
          );
          router.push(path);
          return;
        } catch (joinErr) {
          console.error('[meeting] host auto-join failed', joinErr);
          setError(
            joinErr instanceof Error
              ? joinErr.message
              : 'Meeting created but could not join. Try again from your dashboard.',
          );
          setLoading(false);
          submittingRef.current = false;
          return;
        }
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting');
      setLoading(false);
      submittingRef.current = false;
    }
  }

  function toggleSetting(key: keyof typeof settings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="mx-auto max-w-2xl">
        <HostProfileModal
          open={showHostProfileModal}
          initial={profileInitial}
          onComplete={() => {
            setHostProfileComplete(true);
            setShowHostProfileModal(false);
          }}
        />
        <RegistrationFormBuilderModal
          open={showRegistrationBuilder}
          onClose={() => setShowRegistrationBuilder(false)}
          onSave={(config) => {
            setRegistrationFormConfig(config);
            setShowRegistrationBuilder(false);
          }}
          initialConfig={registrationFormConfig}
        />
        <h1 className="text-2xl font-bold">
          {isInstant ? 'Start Instant Meeting' : 'Schedule Meeting'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure your meeting settings before starting
          {plan === 'FREE' && limits.maxMeetingDurationMinutes && (
            <span className="mt-1 block text-xs">
              Free plan: {limits.maxMeetingDurationMinutes} min limit · up to{' '}
              {limits.meetingAttendeeLimit} attendees
            </span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <Input
            label="Meeting title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
            placeholder={isInstant ? 'Team sync' : 'Team Standup'}
            required
            error={touched.title ? fieldErrors.title : undefined}
          />

          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this meeting about?"
          />

          {!isInstant && (
            <>
              <Input
                label="Date & time"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, scheduledAt: true }))}
                required
                error={touched.scheduledAt ? fieldErrors.scheduledAt : undefined}
              />
              <div>
                <label className="mb-2 block text-sm font-medium">Duration</label>
                <select
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {durationMinutes === 'custom' && (
                <Input
                  label="Custom duration (minutes)"
                  type="number"
                  min={5}
                  max={480}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                />
              )}
              {endTimePreview && (
                <p className="text-sm text-muted-foreground">Ends {endTimePreview}</p>
              )}
            </>
          )}

          <Input
            label={passcodeRequired ? 'Meeting passcode' : 'Meeting passcode (optional)'}
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, passcode: true }))}
            placeholder={
              passcodeRequired ? 'Required by your host settings' : 'Optional — minimum 6 characters'
            }
            error={touched.passcode ? fieldErrors.passcode : undefined}
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
              <Toggle
                label="Registration required"
                description="Guests must register before joining"
                checked={settings.registrationRequired}
                onChange={() => {
                  toggleSetting('registrationRequired');
                  if (!settings.registrationRequired) {
                    setRegistrationFormConfig(createDefaultRegistrationFormConfig());
                  }
                }}
              />
              {settings.registrationRequired && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowRegistrationBuilder(true)}
                >
                  Configure Registration Form
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={!isFormValid || loading || profileLoading}>
              {isInstant ? 'Start Meeting' : 'Schedule Meeting'}
            </Button>
          </div>
        </form>
    </div>
  );
}

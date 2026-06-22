'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { SettingsCard, SettingsShell } from '@/components/settings/SettingsShell';
import {
  readUserSettings,
  saveHostDefaults,
  saveMeetingPrefs,
  type HostDefaultSettings,
  type MeetingPrefSettings,
} from '@/lib/user-settings';

export function MeetingPreferencesSettings() {
  const [meeting, setMeeting] = useState<MeetingPrefSettings | null>(null);
  const [host, setHost] = useState<HostDefaultSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = readUserSettings();
    setMeeting(settings.meeting);
    setHost(settings.host);
  }, []);

  if (!meeting || !host) {
    return (
      <SettingsShell title="Meeting Preferences">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </SettingsShell>
    );
  }

  function handleSave() {
    saveMeetingPrefs(meeting!);
    saveHostDefaults(host!);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  function updateMeeting(partial: Partial<MeetingPrefSettings>) {
    setMeeting((prev) => (prev ? { ...prev, ...partial } : prev));
    if (partial.darkMode !== undefined) {
      saveMeetingPrefs({ darkMode: partial.darkMode });
    }
    if (partial.enableNotifications === true && typeof Notification !== 'undefined') {
      void Notification.requestPermission();
    }
  }

  function updateHost(partial: Partial<HostDefaultSettings>) {
    setHost((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  return (
    <SettingsShell
      title="Meeting Preferences"
      description="Defaults for joining meetings and hosting new ones."
    >
      <div className="space-y-6">
        <SettingsCard
          title="Join defaults"
          description="Applied when you join a meeting from the lobby."
        >
          <div className="space-y-4">
            <Toggle
              label="Join with microphone on"
              checked={meeting.joinWithMic}
              onChange={(checked) => updateMeeting({ joinWithMic: checked })}
            />
            <Toggle
              label="Join with camera on"
              checked={meeting.joinWithCamera}
              onChange={(checked) => updateMeeting({ joinWithCamera: checked })}
            />
            <Toggle
              label="Enable notifications"
              description="Browser notifications for meeting updates"
              checked={meeting.enableNotifications}
              onChange={(checked) => updateMeeting({ enableNotifications: checked })}
            />
            <Toggle
              label="Dark mode"
              description="Use dark theme across Bold"
              checked={meeting.darkMode}
              onChange={(checked) => updateMeeting({ darkMode: checked })}
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="Host defaults"
          description="Pre-selected when you create a new meeting."
        >
          <div className="space-y-4">
            <Toggle
              label="Allow guest attendees"
              description="Guests can join without a Bold account"
              checked={host.allowGuestAttendees}
              onChange={(checked) => updateHost({ allowGuestAttendees: checked })}
            />
            <Toggle
              label="Require meeting passcode"
              description="Prompt for a passcode when creating meetings"
              checked={host.requireMeetingPasscode}
              onChange={(checked) => updateHost({ requireMeetingPasscode: checked })}
            />
            <Toggle
              label="Enable waiting room"
              description="Admit participants before they join"
              checked={host.waitingRoomEnabled}
              onChange={(checked) => updateHost({ waitingRoomEnabled: checked })}
            />
            <Toggle
              label="Allow screen sharing by attendees"
              description="When off, only hosts and co-hosts can share"
              checked={host.allowAttendeeScreenShare}
              onChange={(checked) => updateHost({ allowAttendeeScreenShare: checked })}
            />
          </div>
        </SettingsCard>

        {saved && (
          <p className="text-sm text-green-600 dark:text-green-400">Preferences saved.</p>
        )}

        <Button type="button" onClick={handleSave}>
          Save preferences
        </Button>
      </div>
    </SettingsShell>
  );
}

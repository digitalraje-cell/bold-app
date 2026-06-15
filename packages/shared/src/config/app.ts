/**
 * Centralized app branding configuration.
 * Update env vars to rebrand without code changes.
 */
export interface AppConfig {
  name: string;
  domain: string;
  description: string;
  supportEmail: string;
}

export const APP_CONFIG: AppConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Bold',
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000',
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    'Browser-based meeting platform with YouTube recording',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@bold.hasbrando.com',
};

export function getAppOrigin(): string {
  const domain = APP_CONFIG.domain;
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    return domain.replace(/\/$/, '');
  }
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${domain}`;
}

export function getMeetingUrl(meetingId: string): string {
  return `${getAppOrigin()}/meeting/${meetingId}`;
}

export function getMeetingRoomUrl(meetingId: string): string {
  return `${getAppOrigin()}/meeting/${meetingId}/room`;
}

export function formatMeetingInvite(options: {
  topic: string;
  meetingId: string;
  meetingCode: string;
  passcode?: string | null;
  link?: string;
}): string {
  const { topic, meetingId, meetingCode, passcode, link } = options;
  const joinLink = link || getMeetingUrl(meetingId);
  const lines = [
    `Join my ${APP_CONFIG.name} meeting`,
    '',
    `Meeting Topic:`,
    topic,
    '',
    `Join Link:`,
    joinLink,
    '',
    `Meeting ID:`,
    meetingCode,
  ];

  if (passcode) {
    lines.push('', `Passcode:`, passcode);
  }

  return lines.join('\n');
}

export function getWhatsAppInviteUrl(inviteText: string): string {
  return `https://wa.me/?text=${encodeURIComponent(inviteText)}`;
}

export function getEmailInviteUrl(options: {
  topic: string;
  inviteText: string;
}): string {
  const subject = encodeURIComponent(`${APP_CONFIG.name} Meeting: ${options.topic}`);
  const body = encodeURIComponent(options.inviteText);
  return `mailto:?subject=${subject}&body=${body}`;
}

export const PERMISSIONS = {
  guest: {
    joinMeeting: true,
    createMeeting: false,
    scheduleMeeting: false,
    inviteParticipants: false,
    hostMeeting: false,
    streamYouTube: false,
  },
  verifiedUser: {
    joinMeeting: true,
    createMeeting: true,
    scheduleMeeting: true,
    inviteParticipants: true,
    hostMeeting: true,
    streamYouTube: true,
  },
} as const;

export type UserPermissionTier = keyof typeof PERMISSIONS;

export function canHost(isVerified: boolean): boolean {
  return isVerified;
}

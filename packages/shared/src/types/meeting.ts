import { ChatMode, MeetingStatus, ParticipantRole } from '../index';

export interface Meeting {
  id: string;
  meetingCode: string;
  title: string;
  description?: string | null;
  hostId: string;
  status: MeetingStatus;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  jitsiRoom: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
  password?: string;
  scheduledAt?: string;
  settings?: Partial<MeetingSettingsInput>;
}

export interface MeetingSettingsInput {
  chatEnabled: boolean;
  chatMode: ChatMode;
  reactionsEnabled: boolean;
  raiseHandEnabled: boolean;
  screenShareEnabled: boolean;
  screenShareHostOnly: boolean;
  waitingRoomEnabled: boolean;
  participantRenameEnabled: boolean;
  participantMicAccess: boolean;
  coHostPermissionsEnabled: boolean;
  autoMuteParticipants: boolean;
  registrationRequired?: boolean;
  posterUrl?: string | null;
}

export interface Participant {
  id: string;
  meetingId: string;
  userId?: string | null;
  displayName: string;
  role: ParticipantRole;
  isMuted: boolean;
  isVideoOff: boolean;
  isOnStage: boolean;
  micAllowed: boolean;
  cameraAllowed: boolean;
  handRaised: boolean;
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  content: string;
  isHostOnly: boolean;
  createdAt: string;
}

export function normalizeMeetingCode(input: string): string {
  return input.replace(/[\s-]/g, '');
}

/** Display format: 123 456 7890 */
export function formatMeetingCode(code: string): string {
  const digits = normalizeMeetingCode(code);
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return digits;
}

/** Zoom-style numeric meeting ID (10 digits, easy to remember and type). */
export function generateMeetingCode(): string {
  let code = '';
  for (let i = 0; i < 10; i += 1) {
    code +=
      i === 0
        ? String(Math.floor(Math.random() * 9) + 1)
        : String(Math.floor(Math.random() * 10));
  }
  return code;
}

export function generateJitsiRoomName(meetingId: string): string {
  return `boldmeet-${meetingId}`;
}

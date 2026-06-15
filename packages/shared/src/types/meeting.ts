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
}

export interface Participant {
  id: string;
  meetingId: string;
  userId?: string | null;
  displayName: string;
  role: ParticipantRole;
  isMuted: boolean;
  isVideoOff: boolean;
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

export function generateMeetingCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segment = () =>
    Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment()}-${segment()}-${segment()}`;
}

export function generateJitsiRoomName(meetingId: string): string {
  return `boldmeet-${meetingId}`;
}

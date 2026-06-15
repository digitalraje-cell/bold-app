export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
}

export enum ParticipantRole {
  HOST = 'HOST',
  CO_HOST = 'CO_HOST',
  PARTICIPANT = 'PARTICIPANT',
}

export enum ParticipantStatus {
  WAITING = 'WAITING',
  ADMITTED = 'ADMITTED',
  REMOVED = 'REMOVED',
  LEFT = 'LEFT',
}

export enum ChatMode {
  EVERYONE = 'EVERYONE',
  HOST_ONLY = 'HOST_ONLY',
  DISABLED = 'DISABLED',
}

export enum StreamVisibility {
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED',
  PUBLIC = 'PUBLIC',
}

export enum StreamStatus {
  IDLE = 'IDLE',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  ERROR = 'ERROR',
}

export interface MeetingSettings {
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

export const DEFAULT_MEETING_SETTINGS: MeetingSettings = {
  chatEnabled: true,
  chatMode: ChatMode.EVERYONE,
  reactionsEnabled: true,
  raiseHandEnabled: true,
  screenShareEnabled: true,
  screenShareHostOnly: false,
  waitingRoomEnabled: false,
  participantRenameEnabled: false,
  participantMicAccess: true,
  coHostPermissionsEnabled: true,
  autoMuteParticipants: false,
};

export const REACTIONS = ['👍', '❤️', '👏', '🔥', '😂'] as const;
export type Reaction = (typeof REACTIONS)[number];

export interface SocketEvents {
  'participant:join': { meetingId: string; participantId: string; displayName: string };
  'participant:update': { participantId: string; isMuted?: boolean; isVideoOff?: boolean; role?: ParticipantRole };
  'participant:leave': { participantId: string };
  'chat:message': { id: string; senderId: string; senderName: string; content: string; isHostOnly: boolean; createdAt: string };
  'reaction:send': { participantId: string; reaction: Reaction };
  'hand:raise': { participantId: string; displayName: string };
  'hand:lower': { participantId: string };
  'hand:acknowledge': { participantId: string };
  'waiting:admit': { participantId: string };
  'waiting:reject': { participantId: string };
  'waiting:admit-all': Record<string, never>;
  'settings:update': Partial<MeetingSettings>;
  'meeting:end': Record<string, never>;
}

export * from './types/meeting';
export * from './types/user';
export * from './config/app';
export * from './subscriptions/plans';
export * from './recording/types';
export * from './webinar/types';

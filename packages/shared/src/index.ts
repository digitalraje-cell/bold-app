export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
}

export enum ParticipantRole {
  HOST = 'HOST',
  CO_HOST = 'CO_HOST',
  PANELIST = 'PANELIST',
  PARTICIPANT = 'PARTICIPANT',
  MODERATOR = 'MODERATOR',
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
  HOST_PANELISTS = 'HOST_PANELISTS',
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
  registrationRequired: boolean;
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
  registrationRequired: false,
};

export const REACTIONS = ['👍', '❤️', '👏', '🎉', '😂', '🙌'] as const;
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
  'host:present': { meetingId: string };
  'host:absent': { meetingId: string };
  'host:status': { present: boolean; mediaReady?: boolean };
  'host:media-ready': { meetingId: string };
  'host:media-left': { meetingId: string };
  'participant:role-changed': { meetingId: string; participantId: string; role: ParticipantRole };
  'settings:update': Partial<MeetingSettings>;
  'meeting:end': Record<string, never>;
  'room:mode-changed': { roomMode: string; meetingId: string };
  'participant:stage': {
    participantId: string;
    isOnStage: boolean;
    micAllowed: boolean;
    cameraAllowed: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
    role?: ParticipantRole;
  };
  'chat:mode-changed': { chatMode: string; chatEnabled: boolean };
  'stream:live': {
    meetingId: string;
    title?: string;
    watchUrl?: string;
    provider?: string;
    startedAt?: string;
    status?: string;
  };
  'stream:stopped': { meetingId: string };
  'stream:error': { meetingId: string; message?: string };
}

export * from './room/types';
export * from './rbac/roles';

export * from './media/types';
export * from './types/meeting';
export * from './types/meeting-type';
export * from './types/user';
export * from './config/app';
export * from './subscriptions/plans';
export * from './subscriptions/pricing';
export * from './roadmap/features';
export * from './profile/completion';
export * from './users/constants';
export * from './registration/types';
export * from './recording/types';
export * from './stream/types';
export * from './webinar/types';

/**
 * Unified room system — one room, runtime mode switching.
 * Meeting and Webinar are modes, not separate products.
 */
export enum RoomMode {
  MEETING = 'MEETING',
  WEBINAR = 'WEBINAR',
}

export interface RoomState {
  meetingId: string;
  roomMode: RoomMode;
  title: string;
  participantCount: number;
  settings: RoomModeSettings;
}

export interface RoomModeSettings {
  chatEnabled: boolean;
  chatMode: string;
  reactionsEnabled: boolean;
  raiseHandEnabled: boolean;
  screenShareEnabled: boolean;
}

/** Visible on stage in webinar mode (host/co-host always; participants when invited). */
export function isStageVisibleRole(role: string): boolean {
  return ['HOST', 'CO_HOST'].includes(role);
}

/** Apply webinar defaults to a regular participant */
export interface ParticipantMediaState {
  isOnStage: boolean;
  micAllowed: boolean;
  cameraAllowed: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
}

export function getWebinarParticipantDefaults(): ParticipantMediaState {
  return {
    isOnStage: false,
    micAllowed: false,
    cameraAllowed: false,
    isMuted: true,
    isVideoOff: true,
  };
}

export function getMeetingParticipantDefaults(micAccess = true): ParticipantMediaState {
  return {
    isOnStage: true,
    micAllowed: micAccess,
    cameraAllowed: true,
    isMuted: false,
    isVideoOff: false,
  };
}

export function getStageParticipantState(
  micAllowed = true,
  cameraAllowed = true,
): ParticipantMediaState {
  return {
    isOnStage: true,
    micAllowed,
    cameraAllowed,
    isMuted: !micAllowed,
    isVideoOff: !cameraAllowed,
  };
}

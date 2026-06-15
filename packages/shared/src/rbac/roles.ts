/**
 * Reusable RBAC capability keys for in-room actions.
 */
export type RoomAction =
  | 'switchRoomMode'
  | 'transferHost'
  | 'manageCoHost'
  | 'promotePanelist'
  | 'removeParticipant'
  | 'muteParticipant'
  | 'controlMicPermission'
  | 'controlCameraPermission'
  | 'bringOnStage'
  | 'toggleChat'
  | 'toggleReactions'
  | 'toggleRaiseHand'
  | 'toggleScreenShare'
  | 'moderateWaitingRoom'
  | 'lockRoom'
  | 'managePasscode'
  | 'inviteParticipants'
  | 'useAudio'
  | 'useVideo'
  | 'useChat'
  | 'raiseHand'
  | 'sendReaction'
  | 'screenShare';

const ROLE_CAPABILITIES: Record<string, RoomAction[]> = {
  HOST: [
    'switchRoomMode',
    'transferHost',
    'manageCoHost',
    'promotePanelist',
    'removeParticipant',
    'muteParticipant',
    'controlMicPermission',
    'controlCameraPermission',
    'bringOnStage',
    'toggleChat',
    'toggleReactions',
    'toggleRaiseHand',
    'toggleScreenShare',
    'moderateWaitingRoom',
    'lockRoom',
    'managePasscode',
    'inviteParticipants',
    'useAudio',
    'useVideo',
    'useChat',
    'raiseHand',
    'sendReaction',
    'screenShare',
  ],
  CO_HOST: [
    'removeParticipant',
    'muteParticipant',
    'moderateWaitingRoom',
    'bringOnStage',
    'useAudio',
    'useVideo',
    'useChat',
    'raiseHand',
    'sendReaction',
    'screenShare',
  ],
  PANELIST: [
    'useAudio',
    'useVideo',
    'useChat',
    'raiseHand',
    'sendReaction',
    'screenShare',
  ],
  MODERATOR: [
    'removeParticipant',
    'muteParticipant',
    'moderateWaitingRoom',
    'useChat',
  ],
  PARTICIPANT: ['useChat', 'raiseHand', 'sendReaction'],
  GUEST: ['useChat', 'raiseHand', 'sendReaction'],
};

export function canPerformRoomAction(
  role: string,
  action: RoomAction,
  options?: { isOnStage?: boolean; micAllowed?: boolean; cameraAllowed?: boolean; roomMode?: string },
): boolean {
  const capabilities = ROLE_CAPABILITIES[role] ?? ROLE_CAPABILITIES.GUEST;
  if (!capabilities.includes(action)) return false;

  if (options?.roomMode === 'WEBINAR') {
    if (['useAudio', 'useVideo', 'screenShare'].includes(action)) {
      const visible =
        isStageVisibleRole(role) || options.isOnStage === true;
      if (!visible) return false;
      if (action === 'useAudio') return options.micAllowed !== false;
      if (action === 'useVideo') return options.cameraAllowed !== false;
    }
  }

  return true;
}

function isStageVisibleRole(role: string): boolean {
  return ['HOST', 'CO_HOST', 'PANELIST'].includes(role);
}

export { ROLE_CAPABILITIES };

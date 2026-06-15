'use client';

import { create } from 'zustand';
import { ChatMode, RoomMode } from '@boldmeet/shared';

export interface RoomParticipant {
  id: string;
  displayName: string;
  role: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isOnStage: boolean;
  micAllowed: boolean;
  cameraAllowed: boolean;
  handRaised?: boolean;
  userId?: string | null;
}

interface RoomStore {
  roomMode: RoomMode;
  chatMode: ChatMode;
  chatEnabled: boolean;
  participants: RoomParticipant[];
  myParticipantId: string | null;
  setRoomMode: (mode: RoomMode) => void;
  setChatMode: (mode: ChatMode, enabled?: boolean) => void;
  setParticipants: (participants: RoomParticipant[]) => void;
  setMyParticipantId: (id: string | null) => void;
  updateParticipant: (id: string, patch: Partial<RoomParticipant>) => void;
  reset: () => void;
}

const initialState = {
  roomMode: RoomMode.MEETING,
  chatMode: ChatMode.EVERYONE,
  chatEnabled: true,
  participants: [] as RoomParticipant[],
  myParticipantId: null as string | null,
};

export const useRoomStore = create<RoomStore>((set) => ({
  ...initialState,
  setRoomMode: (mode) => set({ roomMode: mode }),
  setChatMode: (chatMode, chatEnabled) =>
    set((s) => ({
      chatMode,
      chatEnabled: chatEnabled ?? s.chatEnabled,
    })),
  setParticipants: (participants) => set({ participants }),
  setMyParticipantId: (id) => set({ myParticipantId: id }),
  updateParticipant: (id, patch) =>
    set((s) => ({
      participants: s.participants.map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      ),
    })),
  reset: () => set(initialState),
}));

export function canUseMicInRoom(
  participant: RoomParticipant | undefined,
  roomMode: RoomMode,
): boolean {
  if (!participant) return false;
  if (roomMode === RoomMode.MEETING) return participant.micAllowed;
  return participant.isOnStage && participant.micAllowed;
}

export function canUseCameraInRoom(
  participant: RoomParticipant | undefined,
  roomMode: RoomMode,
): boolean {
  if (!participant) return false;
  if (roomMode === RoomMode.MEETING) return participant.cameraAllowed;
  return participant.isOnStage && participant.cameraAllowed;
}

export function canSendChatInRoom(
  participant: RoomParticipant | undefined,
  roomMode: RoomMode,
  chatMode: ChatMode,
  chatEnabled: boolean,
): boolean {
  if (!chatEnabled || chatMode === ChatMode.DISABLED) return false;
  if (chatMode === ChatMode.EVERYONE) return true;
  if (!participant) return false;
  if (chatMode === ChatMode.HOST_ONLY) {
    return participant.role === 'HOST';
  }
  if (chatMode === ChatMode.HOST_PANELISTS) {
    return ['HOST', 'CO_HOST', 'PANELIST'].includes(participant.role);
  }
  return false;
}

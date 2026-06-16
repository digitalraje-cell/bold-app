'use client';

import { useEffect, useCallback } from 'react';
import { RoomMode, ChatMode } from '@boldmeet/shared';
import { useSocket } from '@/hooks/useSocket';
import { useRoomStore, RoomParticipant } from '@/stores/roomStore';
import { api } from '@/lib/api';

export function useRoom(meetingId: string, isHost: boolean) {
  const { on } = useSocket(meetingId);
  const {
    roomMode,
    chatMode,
    chatEnabled,
    screenShareEnabled,
    participants,
    myParticipantId,
    setRoomMode,
    setChatMode,
    setScreenShareEnabled,
    setParticipants,
    setMyParticipantId,
    updateParticipant,
    removeParticipant,
    reset,
  } = useRoomStore();

  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      try {
        const state = (await api.room.get(meetingId)) as {
          roomMode: RoomMode;
          settings: {
            chatMode: ChatMode;
            chatEnabled: boolean;
            screenShareEnabled?: boolean;
          };
          participants: RoomParticipant[];
        };
        if (cancelled) return;
        setRoomMode(state.roomMode);
        setChatMode(state.settings.chatMode, state.settings.chatEnabled);
        setScreenShareEnabled(state.settings.screenShareEnabled ?? true);
        setParticipants(
          state.participants.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            role: p.role,
            isMuted: p.isMuted,
            isVideoOff: p.isVideoOff,
            isOnStage: p.isOnStage,
            micAllowed: p.micAllowed,
            cameraAllowed: p.cameraAllowed,
            handRaised: p.handRaised,
            userId: p.userId,
          })),
        );
      } catch {
        // Room state loads when API is available
      }
    }

    loadRoom();
    return () => {
      cancelled = true;
      reset();
    };
  }, [meetingId, setRoomMode, setChatMode, setScreenShareEnabled, setParticipants, reset]);

  useEffect(() => {
    const unsubMode = on('room:mode-changed', (data: unknown) => {
      const { roomMode: mode } = data as { roomMode: RoomMode };
      setRoomMode(mode);
    });

    const unsubStage = on('participant:stage', (data: unknown) => {
      const patch = data as {
        participantId: string;
        isOnStage: boolean;
        micAllowed: boolean;
        cameraAllowed: boolean;
        isMuted: boolean;
        isVideoOff: boolean;
        role?: string;
      };
      updateParticipant(patch.participantId, {
        isOnStage: patch.isOnStage,
        micAllowed: patch.micAllowed,
        cameraAllowed: patch.cameraAllowed,
        isMuted: patch.isMuted,
        isVideoOff: patch.isVideoOff,
        ...(patch.role ? { role: patch.role } : {}),
      });
    });

    const unsubChat = on('chat:mode-changed', (data: unknown) => {
      const { chatMode: mode, chatEnabled: enabled } = data as {
        chatMode: ChatMode;
        chatEnabled: boolean;
      };
      setChatMode(mode, enabled);
    });

    const unsubSettings = on('settings:update', (data: unknown) => {
      const patch = data as { screenShareEnabled?: boolean };
      if (typeof patch.screenShareEnabled === 'boolean') {
        setScreenShareEnabled(patch.screenShareEnabled);
      }
    });

    const unsubLeft = on('participant:left', (data: unknown) => {
      const { participantId } = data as { participantId: string };
      removeParticipant(participantId);
    });

    return () => {
      unsubMode?.();
      unsubStage?.();
      unsubChat?.();
      unsubSettings?.();
      unsubLeft?.();
    };
  }, [on, setRoomMode, setChatMode, setScreenShareEnabled, updateParticipant, removeParticipant]);

  const switchRoomMode = useCallback(
    async (mode: RoomMode) => {
      const result = (await api.room.switchMode(meetingId, mode)) as {
        roomMode: RoomMode;
        participants: RoomParticipant[];
      };
      setRoomMode(result.roomMode);
      setParticipants(result.participants);
    },
    [meetingId, setRoomMode, setParticipants],
  );

  const promoteToPanelist = useCallback(
    async (participantId: string) => {
      const updated = (await api.room.promotePanelist(meetingId, participantId)) as RoomParticipant;
      updateParticipant(participantId, updated);
    },
    [meetingId, updateParticipant],
  );

  const bringOnStage = useCallback(
    async (participantId: string, micAllowed = true, cameraAllowed = true) => {
      const updated = (await api.room.bringOnStage(meetingId, participantId, {
        micAllowed,
        cameraAllowed,
      })) as RoomParticipant;
      updateParticipant(participantId, updated);
    },
    [meetingId, updateParticipant],
  );

  const removeFromStage = useCallback(
    async (participantId: string) => {
      const updated = (await api.room.removeFromStage(meetingId, participantId)) as RoomParticipant;
      updateParticipant(participantId, updated);
    },
    [meetingId, updateParticipant],
  );

  const updateChatMode = useCallback(
    async (mode: ChatMode, enabled?: boolean) => {
      const settings = (await api.room.updateChatMode(meetingId, mode, enabled)) as {
        chatMode: ChatMode;
        chatEnabled: boolean;
      };
      setChatMode(settings.chatMode, settings.chatEnabled);
    },
    [meetingId, setChatMode],
  );

  return {
    roomMode,
    chatMode,
    chatEnabled,
    screenShareEnabled,
    participants,
    myParticipantId,
    setMyParticipantId,
    setScreenShareEnabled,
    switchRoomMode,
    promoteToPanelist,
    bringOnStage,
    removeFromStage,
    updateChatMode,
    isHost,
  };
}

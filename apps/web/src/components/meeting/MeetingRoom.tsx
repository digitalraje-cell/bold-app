'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RoomMode } from '@boldmeet/shared';
import { useJitsi } from '@/hooks/useJitsi';
import { useSocket } from '@/hooks/useSocket';
import { useMeetingPresence } from '@/hooks/useMeetingPresence';
import { useRoom } from '@/hooks/useRoom';
import {
  canUseMicInRoom,
  canUseCameraInRoom,
  canSendChatInRoom,
  canShareScreenInRoom,
} from '@/stores/roomStore';
import { useMeetingFullscreen } from '@/contexts/MeetingFullscreenContext';
import { FullscreenWrapper } from '@/components/meeting/FullscreenWrapper';
import { ControlsBar } from '@/components/meeting/ControlsBar';
import { ChatPanel } from '@/components/meeting/ChatPanel';
import { ParticipantsPanel } from '@/components/meeting/ParticipantsPanel';
import { ReactionsOverlay } from '@/components/meeting/ReactionsOverlay';
import { InviteModal } from '@/components/meeting/InviteModal';
import { HostLeaveModal } from '@/components/meeting/HostLeaveModal';
import { HostWaitingScreen } from '@/components/meeting/HostWaitingScreen';
import { RoomModeSwitcher } from '@/components/meeting/RoomModeSwitcher';
import { WebinarModeBanner } from '@/components/meeting/WebinarModeBanner';
import {
  MeetingDurationModal,
  MeetingGraceWarning,
} from '@/components/meeting/MeetingDurationModal';
import { useMeetingDuration } from '@/hooks/useMeetingDuration';
import { api } from '@/lib/api';
import { readGuestJoinSession } from '@/lib/meeting-join';

interface MeetingRoomProps {
  meetingId: string;
  jitsiRoom: string;
  title: string;
  isHost: boolean;
  displayName?: string;
  participantId?: string;
}

export function MeetingRoom(props: MeetingRoomProps) {
  return (
    <FullscreenWrapper>
      <MeetingRoomInner {...props} />
    </FullscreenWrapper>
  );
}

function MeetingRoomInner({
  meetingId,
  jitsiRoom,
  title,
  isHost,
  displayName: displayNameProp,
  participantId: participantIdProp,
}: MeetingRoomProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useMeetingFullscreen();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [activePanel, setActivePanel] = useState<'chat' | 'participants' | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [reactions, setReactions] = useState<{ id: string; reaction: string }[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [hostLeaveOpen, setHostLeaveOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [modeSwitching, setModeSwitching] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const guestSession = typeof window !== 'undefined' ? readGuestJoinSession(meetingId) : null;
  const participantId = participantIdProp || guestSession?.participantId;
  const displayName = displayNameProp || session?.user?.name || session?.user?.email || 'Guest';
  const hangupRef = useRef<(() => void) | null>(null);
  const meetingEndedRef = useRef(false);

  const { canJoinMedia, notifyHostMediaReady, notifyHostMediaLeft } = useMeetingPresence(
    meetingId,
    isHost,
  );

  const {
    roomMode,
    chatMode,
    chatEnabled,
    screenShareEnabled,
    participants,
    switchRoomMode,
    promoteToPanelist,
    bringOnStage,
    removeFromStage,
    updateChatMode,
    setScreenShareEnabled,
  } = useRoom(meetingId, isHost);

  const myParticipant =
    participants.find((p) => p.userId === session?.user?.id) ||
    (participantId ? participants.find((p) => p.id === participantId) : undefined);

  const myRole = myParticipant?.role ?? (isHost ? 'HOST' : 'PARTICIPANT');
  const isModerator = myRole === 'HOST' || myRole === 'CO_HOST';

  const canMic = canUseMicInRoom(myParticipant, roomMode);
  const canCamera = canUseCameraInRoom(myParticipant, roomMode);
  const canChat = canSendChatInRoom(myParticipant, roomMode, chatMode, chatEnabled);
  const canShareScreen =
    canShareScreenInRoom(myParticipant, roomMode, screenShareEnabled) ||
    (isHost && myRole === 'HOST' && !myParticipant);

  const handleLeave = useCallback(
    (message?: string) => {
      if (meetingEndedRef.current) return;
      meetingEndedRef.current = true;
      hangupRef.current?.();
      router.push(message ? `/dashboard?message=${encodeURIComponent(message)}` : '/dashboard');
    },
    [router],
  );

  const {
    toggleAudio,
    toggleVideo,
    toggleShareScreen,
    hangup,
    muteAll,
    isScreenSharing,
    isPresenterLayout,
  } = useJitsi({
    roomName: jitsiRoom,
    displayName,
    isHost,
    enabled: canJoinMedia,
    // Bold gates sharing in controls; keep Jitsi embed stable when host toggles permissions.
    allowDesktopSharing: true,
    containerRef,
    onReady: () => {
      if (isHost) notifyHostMediaReady();
    },
    onLeave: () => {
      if (isHost) notifyHostMediaLeft();
      handleLeave();
    },
  });

  hangupRef.current = hangup;

  const handleDurationExpired = useCallback(() => {
    hangupRef.current?.();
  }, []);

  const {
    showExpiredModal,
    showGraceWarning,
    dismissExpiredModal,
    dismissGraceWarning,
    durationState,
  } = useMeetingDuration(meetingId, handleDurationExpired);

  const handleLeaveMeeting = useCallback(async () => {
    setLeaveLoading(true);
    try {
      await api.meetings.leave(meetingId);
    } catch {
      // Still leave the call if the API fails
    } finally {
      setLeaveLoading(false);
      setHostLeaveOpen(false);
      handleLeave();
    }
  }, [meetingId, handleLeave]);

  const handleEndMeetingForAll = useCallback(async () => {
    setLeaveLoading(true);
    try {
      await api.meetings.end(meetingId);
    } catch {
      // Still leave the call if the API fails
    } finally {
      setLeaveLoading(false);
      setHostLeaveOpen(false);
      handleLeave();
    }
  }, [meetingId, handleLeave]);

  const { emit, on } = useSocket(meetingId);

  useEffect(() => {
    api.meetings
      .get(meetingId)
      .then((meeting) => {
        const m = meeting as {
          isLocked?: boolean;
          settings?: { waitingRoomEnabled?: boolean; screenShareEnabled?: boolean };
        };
        if (myRole === 'HOST') {
          setIsLocked(Boolean(m.isLocked));
          setWaitingRoomEnabled(Boolean(m.settings?.waitingRoomEnabled));
        }
      })
      .catch(() => {
        // ignore
      });
  }, [meetingId, myRole]);

  useEffect(() => {
    const unsubEnded = on('meeting:ended', (data: unknown) => {
      const { message } = data as { message?: string };
      handleLeave(message || 'Meeting ended by host');
    });

    const unsubLeft = on('participant:left', (data: unknown) => {
      const { participantId: leftId } = data as { participantId?: string };
      if (participantId && leftId === participantId) {
        handleLeave('You were removed from the meeting');
      }
    });

    return () => {
      unsubEnded?.();
      unsubLeft?.();
    };
  }, [on, handleLeave, participantId]);

  useEffect(() => {
    if (roomMode === RoomMode.WEBINAR && myParticipant && !canMic && !isMuted) {
      toggleAudio();
      setIsMuted(true);
    }
  }, [roomMode, myParticipant, canMic, isMuted, toggleAudio]);

  useEffect(() => {
    if (roomMode === RoomMode.WEBINAR && myParticipant && !canCamera && !isVideoOff) {
      toggleVideo();
      setIsVideoOff(true);
    }
  }, [roomMode, myParticipant, canCamera, isVideoOff, toggleVideo]);

  const handleToggleMic = () => {
    if (!canMic) return;
    toggleAudio();
    setIsMuted((prev) => !prev);
  };

  const handleToggleVideo = () => {
    if (!canCamera) return;
    toggleVideo();
    setIsVideoOff((prev) => !prev);
  };

  const handleToggleShare = () => {
    if (!canShareScreen) {
      setShareError(
        screenShareEnabled
          ? 'Screen sharing is not available for your role'
          : 'The host has not allowed participant screen sharing',
      );
      setTimeout(() => setShareError(null), 4000);
      return;
    }
    setShareError(null);
    toggleShareScreen();
  };

  const handleRaiseHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    emit(next ? 'hand:raise' : 'hand:lower', {
      participantId: participantId || session?.user?.id,
      displayName,
    });
  };

  const handleReaction = (reaction: string) => {
    emit('reaction:send', { participantId: participantId || session?.user?.id, reaction });
    const id = `${Date.now()}-${Math.random()}`;
    setReactions((prev) => [...prev, { id, reaction }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  };

  const handleSwitchRoomMode = async (mode: RoomMode) => {
    if (mode === roomMode) return;
    setModeSwitching(true);
    try {
      await switchRoomMode(mode);
    } finally {
      setModeSwitching(false);
    }
  };

  const handleToggleLock = async () => {
    const next = !isLocked;
    try {
      await api.meetings.lock(meetingId, next);
      setIsLocked(next);
    } catch {
      // ignore
    }
  };

  const handleToggleWaitingRoom = async () => {
    const next = !waitingRoomEnabled;
    try {
      await api.meetings.updateSettings(meetingId, { waitingRoomEnabled: next });
      setWaitingRoomEnabled(next);
    } catch {
      // ignore
    }
  };

  const handleToggleParticipantScreenShare = async () => {
    const next = !screenShareEnabled;
    try {
      await api.meetings.updateSettings(meetingId, { screenShareEnabled: next });
      setScreenShareEnabled(next);
    } catch {
      // ignore — settings:update socket syncs on success
    }
  };

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {!canJoinMedia && <HostWaitingScreen meetingId={meetingId} title={title} />}

      {canJoinMedia && (
        <div
          ref={containerRef}
          className={`absolute inset-0 [&_iframe]:border-0 ${
            isPresenterLayout || isScreenSharing ? 'presenter-stage' : ''
          }`}
        />
      )}

      <ReactionsOverlay reactions={reactions} />
      <WebinarModeBanner roomMode={roomMode} />

      {shareError && (
        <div className="absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-lg bg-amber-600/95 px-4 py-2 text-sm text-white shadow-lg">
          {shareError}
        </div>
      )}

      {(isScreenSharing || isPresenterLayout) && canJoinMedia && (
        <div className="absolute right-4 top-4 z-30 rounded-full bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
          {isScreenSharing ? 'You are presenting' : 'Presenter view'}
        </div>
      )}

      {activePanel === 'chat' && (
        <ChatPanel
          meetingId={meetingId}
          chatMode={chatMode}
          chatEnabled={chatEnabled}
          canSend={canChat}
          isHost={isModerator}
          onClose={() => setActivePanel(null)}
          onChatModeChange={isModerator ? (mode) => updateChatMode(mode) : undefined}
          onSend={(content) =>
            emit('chat:message', {
              senderId: participantId || session?.user?.id,
              senderName: displayName,
              content,
              createdAt: new Date().toISOString(),
            })
          }
        />
      )}

      {activePanel === 'participants' && (
        <ParticipantsPanel
          meetingId={meetingId}
          isModerator={isModerator}
          isHost={myRole === 'HOST'}
          roomMode={roomMode}
          waitingRoomEnabled={waitingRoomEnabled}
          onClose={() => setActivePanel(null)}
          onPromotePanelist={isModerator ? promoteToPanelist : undefined}
          onBringOnStage={isModerator ? bringOnStage : undefined}
          onRemoveFromStage={isModerator ? removeFromStage : undefined}
          onMuteAll={isModerator ? muteAll : undefined}
        />
      )}

      <div className="absolute left-4 top-4 z-30 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur">
            {title}
          </div>
        </div>
        <div className="rounded-lg bg-black/50 px-3 py-1 text-xs text-white/70 backdrop-blur">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </div>
        {isModerator && (
          <RoomModeSwitcher
            roomMode={roomMode}
            onSwitch={handleSwitchRoomMode}
            disabled={modeSwitching}
          />
        )}
      </div>

      <ControlsBar
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isFullscreen={isFullscreen}
        isScreenSharing={isScreenSharing}
        activePanel={activePanel}
        micDisabled={!canMic}
        cameraDisabled={!canCamera}
        shareDisabled={!canShareScreen}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
        onToggleShare={handleToggleShare}
        onToggleChat={() => setActivePanel((p) => (p === 'chat' ? null : 'chat'))}
        onToggleParticipants={() =>
          setActivePanel((p) => (p === 'participants' ? null : 'participants'))
        }
        onToggleReactions={() => handleReaction('👍')}
        onRaiseHand={handleRaiseHand}
        onToggleFullscreen={() => void toggleFullscreen()}
        onInvite={isModerator ? () => setInviteOpen(true) : undefined}
        onLeave={() => {
          if (myRole === 'HOST') {
            setHostLeaveOpen(true);
            return;
          }
          void handleLeaveMeeting();
        }}
        isHost={myRole === 'HOST'}
        isModerator={isModerator}
        onEndMeeting={
          myRole === 'HOST'
            ? () => {
                void handleEndMeetingForAll();
              }
            : undefined
        }
        onMuteAll={isModerator ? muteAll : undefined}
        isLocked={isLocked}
        onToggleLock={myRole === 'HOST' ? handleToggleLock : undefined}
        waitingRoomEnabled={waitingRoomEnabled}
        onToggleWaitingRoom={myRole === 'HOST' ? handleToggleWaitingRoom : undefined}
        participantScreenShareEnabled={screenShareEnabled}
        onToggleParticipantScreenShare={
          myRole === 'HOST' ? handleToggleParticipantScreenShare : undefined
        }
      />

      <MeetingDurationModal
        open={showExpiredModal}
        message={durationState?.message}
        onClose={dismissExpiredModal}
        onLeave={handleLeaveMeeting}
      />
      <MeetingGraceWarning open={showGraceWarning} onDismiss={dismissGraceWarning} />

      <InviteModal meetingId={meetingId} open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <HostLeaveModal
        open={hostLeaveOpen}
        onClose={() => setHostLeaveOpen(false)}
        onLeave={() => void handleLeaveMeeting()}
        onEndForAll={() => void handleEndMeetingForAll()}
        loading={leaveLoading}
      />
    </div>
  );
}

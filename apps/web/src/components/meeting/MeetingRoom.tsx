'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RoomMode, ChatMode } from '@boldmeet/shared';
import { useJitsi } from '@/hooks/useJitsi';
import { useSocket } from '@/hooks/useSocket';
import { useRoom } from '@/hooks/useRoom';
import { canUseMicInRoom, canUseCameraInRoom, canSendChatInRoom } from '@/stores/roomStore';
import { FullscreenWrapper } from '@/components/meeting/FullscreenWrapper';
import { ControlsBar } from '@/components/meeting/ControlsBar';
import { ChatPanel } from '@/components/meeting/ChatPanel';
import { ParticipantsPanel } from '@/components/meeting/ParticipantsPanel';
import { ReactionsOverlay } from '@/components/meeting/ReactionsOverlay';
import { InviteModal } from '@/components/meeting/InviteModal';
import { HostLeaveModal } from '@/components/meeting/HostLeaveModal';
import { RoomModeSwitcher } from '@/components/meeting/RoomModeSwitcher';
import { WebinarModeBanner } from '@/components/meeting/WebinarModeBanner';
import {
  MeetingDurationModal,
  MeetingGraceWarning,
} from '@/components/meeting/MeetingDurationModal';
import { useMeetingDuration } from '@/hooks/useMeetingDuration';
import { api } from '@/lib/api';

interface MeetingRoomProps {
  meetingId: string;
  jitsiRoom: string;
  title: string;
  isHost: boolean;
  displayName?: string;
}

export function MeetingRoom({ meetingId, jitsiRoom, title, isHost, displayName: displayNameProp }: MeetingRoomProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePanel, setActivePanel] = useState<'chat' | 'participants' | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [reactions, setReactions] = useState<{ id: string; reaction: string }[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [hostLeaveOpen, setHostLeaveOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [modeSwitching, setModeSwitching] = useState(false);

  const displayName = displayNameProp || session?.user?.name || session?.user?.email || 'Guest';
  const hangupRef = useRef<(() => void) | null>(null);
  const meetingEndedRef = useRef(false);

  const {
    roomMode,
    chatMode,
    chatEnabled,
    participants,
    switchRoomMode,
    promoteToPanelist,
    bringOnStage,
    removeFromStage,
    updateChatMode,
  } = useRoom(meetingId, isHost);

  const myParticipant = participants.find((p) => p.userId === session?.user?.id);
  const canMic = canUseMicInRoom(myParticipant, roomMode);
  const canCamera = canUseCameraInRoom(myParticipant, roomMode);
  const canChat = canSendChatInRoom(myParticipant, roomMode, chatMode, chatEnabled);

  const handleLeave = useCallback((message?: string) => {
    if (meetingEndedRef.current) return;
    meetingEndedRef.current = true;
    hangupRef.current?.();
    router.push(message ? `/dashboard?message=${encodeURIComponent(message)}` : '/dashboard');
  }, [router]);

  const { toggleAudio, toggleVideo, toggleShareScreen, hangup } = useJitsi({
    roomName: jitsiRoom,
    displayName,
    containerRef,
    onLeave: () => handleLeave(),
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
    const unsubEnded = on('meeting:ended', (data: unknown) => {
      const { message } = data as { message?: string };
      handleLeave(message || 'Meeting ended by host');
    });

    return () => {
      unsubEnded?.();
    };
  }, [on, handleLeave]);

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

  const handleRaiseHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    emit(next ? 'hand:raise' : 'hand:lower', {
      participantId: session?.user?.id,
      displayName,
    });
  };

  const handleReaction = (reaction: string) => {
    emit('reaction:send', { participantId: session?.user?.id, reaction });
    const id = `${Date.now()}-${Math.random()}`;
    setReactions((prev) => [...prev, { id, reaction }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  };

  const handleToggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
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

  return (
    <FullscreenWrapper isFullscreen={isFullscreen} onToggle={setIsFullscreen}>
      <div className="relative flex flex-1 overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />

        <ReactionsOverlay reactions={reactions} />
        <WebinarModeBanner roomMode={roomMode} />

        {activePanel === 'chat' && (
          <ChatPanel
            meetingId={meetingId}
            chatMode={chatMode}
            chatEnabled={chatEnabled}
            canSend={canChat}
            isHost={isHost}
            onClose={() => setActivePanel(null)}
            onChatModeChange={isHost ? (mode) => updateChatMode(mode) : undefined}
            onSend={(content) =>
              emit('chat:message', {
                senderId: session?.user?.id,
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
            isHost={isHost}
            roomMode={roomMode}
            onClose={() => setActivePanel(null)}
            onPromotePanelist={isHost ? promoteToPanelist : undefined}
            onBringOnStage={isHost ? bringOnStage : undefined}
            onRemoveFromStage={isHost ? removeFromStage : undefined}
          />
        )}

        <div className="absolute left-4 top-4 z-30 flex flex-col gap-2">
          <div className="rounded-lg bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur">
            {title}
          </div>
          <div className="rounded-lg bg-black/50 px-3 py-1 text-xs text-white/70 backdrop-blur">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </div>
          {isHost && (
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
          activePanel={activePanel}
          micDisabled={!canMic}
          cameraDisabled={!canCamera}
          onToggleMic={handleToggleMic}
          onToggleVideo={handleToggleVideo}
          onToggleShare={toggleShareScreen}
          onToggleChat={() =>
            setActivePanel((p) => (p === 'chat' ? null : 'chat'))
          }
          onToggleParticipants={() =>
            setActivePanel((p) => (p === 'participants' ? null : 'participants'))
          }
          onToggleReactions={() => handleReaction('👍')}
          onRaiseHand={handleRaiseHand}
          onToggleFullscreen={handleToggleFullscreen}
          onInvite={isHost ? () => setInviteOpen(true) : undefined}
          onLeave={() => {
            if (isHost) {
              setHostLeaveOpen(true);
              return;
            }
            void handleLeaveMeeting();
          }}
          isHost={isHost}
          onEndMeeting={() => {
            void handleEndMeetingForAll();
          }}
        />
      </div>

      <MeetingDurationModal
        open={showExpiredModal}
        message={durationState?.message}
        onClose={dismissExpiredModal}
        onLeave={handleLeaveMeeting}
      />
      <MeetingGraceWarning open={showGraceWarning} onDismiss={dismissGraceWarning} />

      <InviteModal
        meetingId={meetingId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />

      <HostLeaveModal
        open={hostLeaveOpen}
        onClose={() => setHostLeaveOpen(false)}
        onLeave={() => void handleLeaveMeeting()}
        onEndForAll={() => void handleEndMeetingForAll()}
        loading={leaveLoading}
      />
    </FullscreenWrapper>
  );
}

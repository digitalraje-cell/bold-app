'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useJitsi } from '@/hooks/useJitsi';
import { useSocket } from '@/hooks/useSocket';
import { FullscreenWrapper } from '@/components/meeting/FullscreenWrapper';
import { ControlsBar } from '@/components/meeting/ControlsBar';
import { ChatPanel } from '@/components/meeting/ChatPanel';
import { ParticipantsPanel } from '@/components/meeting/ParticipantsPanel';
import { ReactionsOverlay } from '@/components/meeting/ReactionsOverlay';
import { InviteModal } from '@/components/meeting/InviteModal';
import {
  MeetingDurationModal,
  MeetingGraceWarning,
} from '@/components/meeting/MeetingDurationModal';
import { useMeetingDuration } from '@/hooks/useMeetingDuration';

interface MeetingRoomProps {
  meetingId: string;
  jitsiRoom: string;
  title: string;
  isHost: boolean;
}

export function MeetingRoom({ meetingId, jitsiRoom, title, isHost }: MeetingRoomProps) {
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

  const displayName = session?.user?.name || 'Guest';
  const hangupRef = useRef<(() => void) | null>(null);

  const handleLeave = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const { toggleAudio, toggleVideo, toggleShareScreen, hangup } = useJitsi({
    roomName: jitsiRoom,
    displayName,
    containerRef,
    onLeave: handleLeave,
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

  const handleLeaveMeeting = useCallback(() => {
    hangupRef.current?.();
    handleLeave();
  }, [handleLeave]);

  const { emit } = useSocket(meetingId);

  const handleToggleMic = () => {
    toggleAudio();
    setIsMuted((prev) => !prev);
  };

  const handleToggleVideo = () => {
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

  return (
    <FullscreenWrapper isFullscreen={isFullscreen} onToggle={setIsFullscreen}>
      <div className="relative flex flex-1 overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />

        <ReactionsOverlay reactions={reactions} />

        {activePanel === 'chat' && (
          <ChatPanel
            meetingId={meetingId}
            onClose={() => setActivePanel(null)}
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
            onClose={() => setActivePanel(null)}
          />
        )}

        <div className="absolute left-4 top-4 z-30 rounded-lg bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur">
          {title}
        </div>

        <ControlsBar
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isFullscreen={isFullscreen}
          activePanel={activePanel}
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
            hangup();
            handleLeave();
          }}
          isHost={isHost}
          onEndMeeting={() => {
            hangup();
            handleLeave();
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
    </FullscreenWrapper>
  );
}

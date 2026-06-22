'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  MessageSquare,
  Users,
  Hand,
  Smile,
  Maximize,
  PhoneOff,
  UserPlus,
  LogOut,
  VolumeX,
  Lock,
  Unlock,
  DoorOpen,
  Radio,
  Square,
  MoreHorizontal,
} from 'lucide-react';
import { RoomMode } from '@boldmeet/shared';
import { cn } from '@/lib/utils';

interface ControlsBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isFullscreen: boolean;
  isScreenSharing?: boolean;
  activePanel: 'chat' | 'participants' | null;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleShare: () => void;
  micDisabled?: boolean;
  cameraDisabled?: boolean;
  shareDisabled?: boolean;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onReaction: (reaction: string) => void;
  onRaiseHand: () => void;
  handRaised?: boolean;
  onToggleFullscreen: () => void;
  onInvite?: () => void;
  onLeave: () => void;
  isHost?: boolean;
  isModerator?: boolean;
  onEndMeeting?: () => void;
  onMuteAll?: () => void;
  isLocked?: boolean;
  onToggleLock?: () => void;
  waitingRoomEnabled?: boolean;
  onToggleWaitingRoom?: () => void;
  participantScreenShareEnabled?: boolean;
  onToggleParticipantScreenShare?: () => void;
  roomMode?: RoomMode;
  onSwitchRoomMode?: (mode: RoomMode) => void;
  reactionsEnabled?: boolean;
  raiseHandEnabled?: boolean;
  isLiveStream?: boolean;
  onGoLive?: () => void;
  onStopLive?: () => void;
  streamStopping?: boolean;
  canManageBroadcast?: boolean;
  controlsVisible?: boolean;
  onRevealControls?: () => void;
}

function ControlButton({
  icon: Icon,
  label,
  active,
  danger,
  disabled,
  onClick,
}: {
  icon: typeof Mic;
  label: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-all duration-200 sm:h-12 sm:w-12',
        disabled && 'cursor-not-allowed opacity-40',
        danger
          ? 'bg-destructive hover:opacity-90'
          : active
            ? 'bg-white text-black shadow-sm'
            : 'bg-white/12 text-white hover:bg-white/20',
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

const MEETING_REACTIONS = ['👍', '❤️', '👏', '🎉', '😂', '🙌'] as const;

export function ControlsBar({
  isMuted,
  isVideoOff,
  isFullscreen,
  isScreenSharing,
  activePanel,
  onToggleMic,
  onToggleVideo,
  onToggleShare,
  micDisabled,
  cameraDisabled,
  shareDisabled,
  onToggleChat,
  onToggleParticipants,
  onReaction,
  onRaiseHand,
  handRaised = false,
  onToggleFullscreen,
  onInvite,
  onLeave,
  isHost,
  isModerator,
  onEndMeeting,
  onMuteAll,
  isLocked,
  onToggleLock,
  waitingRoomEnabled,
  onToggleWaitingRoom,
  participantScreenShareEnabled,
  onToggleParticipantScreenShare,
  roomMode,
  onSwitchRoomMode,
  reactionsEnabled = true,
  raiseHandEnabled = true,
  isLiveStream,
  onGoLive,
  onStopLive,
  streamStopping,
  canManageBroadcast,
  controlsVisible = true,
  onRevealControls,
}: ControlsBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [moreOpen]);

  const hasMoreItems =
    reactionsEnabled ||
    raiseHandEnabled ||
    Boolean(onInvite) ||
    Boolean(onSwitchRoomMode) ||
    Boolean(onToggleFullscreen) ||
    Boolean(onToggleLock) ||
    Boolean(onToggleWaitingRoom) ||
    Boolean(onToggleParticipantScreenShare) ||
    Boolean(onMuteAll) ||
    Boolean(canManageBroadcast && onGoLive) ||
    Boolean(isHost && onEndMeeting);

  return (
    <div
      className="pointer-events-none absolute bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10 sm:px-6 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      style={{ ['--meeting-controls-offset' as string]: '5.5rem' }}
      onMouseMove={onRevealControls}
      onTouchStart={onRevealControls}
    >
      <div
        className={cn(
          'pointer-events-auto meeting-controls-float mx-auto flex max-w-full items-center justify-center gap-1.5 px-2 py-2 sm:max-w-lg sm:gap-2 sm:px-3 sm:py-2.5',
          !controlsVisible && 'meeting-controls-float--hidden',
        )}
      >
        <ControlButton
          icon={isMuted ? MicOff : Mic}
          label={micDisabled ? 'Mic disabled' : isMuted ? 'Unmute' : 'Mute'}
          active={!isMuted && !micDisabled}
          danger={isMuted && !micDisabled}
          disabled={micDisabled}
          onClick={onToggleMic}
        />
        <ControlButton
          icon={isVideoOff ? VideoOff : Video}
          label={cameraDisabled ? 'Camera disabled' : isVideoOff ? 'Start video' : 'Stop video'}
          active={!isVideoOff && !cameraDisabled}
          danger={isVideoOff && !cameraDisabled}
          disabled={cameraDisabled}
          onClick={onToggleVideo}
        />
        {!shareDisabled && (
          <ControlButton
            icon={isScreenSharing ? MonitorOff : MonitorUp}
            label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            active={isScreenSharing}
            onClick={onToggleShare}
          />
        )}
        <ControlButton
          icon={MessageSquare}
          label="Chat"
          active={activePanel === 'chat'}
          onClick={onToggleChat}
        />
        <ControlButton
          icon={Users}
          label="Participants"
          active={activePanel === 'participants'}
          onClick={onToggleParticipants}
        />

        {hasMoreItems && (
          <div className="relative" ref={moreRef}>
            <ControlButton
              icon={MoreHorizontal}
              label="More options"
              active={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
            />
            {moreOpen && (
              <div className="absolute bottom-full right-0 z-50 mb-2 min-w-[12rem] overflow-hidden rounded-[var(--radius-meeting)] meeting-glass-panel py-1 shadow-[var(--shadow-float)]">
                {reactionsEnabled && (
                  <div className="border-b border-white/10 px-3 py-2">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-left text-sm text-white hover:text-white/90"
                      onClick={() => setReactionsOpen((open) => !open)}
                    >
                      <span>Reactions</span>
                      <Smile className="h-4 w-4 text-white/60" />
                    </button>
                    {reactionsOpen && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {MEETING_REACTIONS.map((reaction) => (
                          <button
                            key={reaction}
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-lg hover:bg-white/20"
                            aria-label={`Send ${reaction} reaction`}
                            onClick={() => {
                              setReactionsOpen(false);
                              setMoreOpen(false);
                              onReaction(reaction);
                            }}
                          >
                            {reaction}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {raiseHandEnabled && (
                  <MenuItem
                    label={handRaised ? 'Lower hand' : 'Raise hand'}
                    onClick={() => {
                      setMoreOpen(false);
                      onRaiseHand();
                    }}
                  />
                )}
                {onInvite && (
                  <MenuItem label="Invite" onClick={() => { setMoreOpen(false); onInvite(); }} />
                )}
                {onSwitchRoomMode && roomMode && (
                  <>
                    <MenuItem
                      label={roomMode === RoomMode.MEETING ? 'Switch to webinar' : 'Switch to meeting'}
                      onClick={() => {
                        setMoreOpen(false);
                        onSwitchRoomMode(
                          roomMode === RoomMode.MEETING ? RoomMode.WEBINAR : RoomMode.MEETING,
                        );
                      }}
                    />
                  </>
                )}
                <MenuItem
                  label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  onClick={() => { setMoreOpen(false); onToggleFullscreen(); }}
                />
                {isModerator && onMuteAll && (
                  <MenuItem label="Mute all" onClick={() => { setMoreOpen(false); onMuteAll(); }} />
                )}
                {isHost && onToggleLock && (
                  <MenuItem
                    label={isLocked ? 'Unlock meeting' : 'Lock meeting'}
                    onClick={() => { setMoreOpen(false); onToggleLock(); }}
                  />
                )}
                {isHost && onToggleWaitingRoom && (
                  <MenuItem
                    label={waitingRoomEnabled ? 'Waiting room on' : 'Waiting room off'}
                    onClick={() => { setMoreOpen(false); onToggleWaitingRoom(); }}
                  />
                )}
                {isHost && onToggleParticipantScreenShare && (
                  <MenuItem
                    label={
                      participantScreenShareEnabled
                        ? 'Participant sharing on'
                        : 'Participant sharing off'
                    }
                    onClick={() => { setMoreOpen(false); onToggleParticipantScreenShare(); }}
                  />
                )}
                {canManageBroadcast && !isLiveStream && onGoLive && (
                  <MenuItem label="Start YouTube Live" onClick={() => { setMoreOpen(false); onGoLive(); }} />
                )}
                {canManageBroadcast && isLiveStream && onStopLive && (
                  <MenuItem
                    label={streamStopping ? 'Stopping…' : 'Stop YouTube Live'}
                    onClick={() => { setMoreOpen(false); onStopLive(); }}
                  />
                )}
                {isHost && onEndMeeting && (
                  <MenuItem
                    label="End meeting for all"
                    danger
                    onClick={() => { setMoreOpen(false); onEndMeeting(); }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        <div className="mx-1 h-8 w-px shrink-0 bg-white/20" />

        <ControlButton icon={LogOut} label="Leave meeting" danger onClick={onLeave} />
      </div>
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full px-3 py-2.5 text-left text-sm hover:bg-white/10',
        danger ? 'text-red-400' : 'text-white',
      )}
    >
      {label}
    </button>
  );
}

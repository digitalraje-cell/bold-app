'use client';

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
} from 'lucide-react';
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
  onToggleReactions: () => void;
  onRaiseHand: () => void;
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
  isLiveStream?: boolean;
  onGoLive?: () => void;
  onStopLive?: () => void;
  streamStopping?: boolean;
  canManageBroadcast?: boolean;
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
        'flex h-12 w-12 flex-col items-center justify-center rounded-xl transition',
        disabled && 'cursor-not-allowed opacity-40',
        danger
          ? 'bg-red-600 hover:bg-red-700'
          : active
            ? 'bg-primary text-primary-foreground'
            : 'bg-white/10 text-white hover:bg-white/20',
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

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
  onToggleReactions,
  onRaiseHand,
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
  isLiveStream,
  onGoLive,
  onStopLive,
  streamStopping,
  canManageBroadcast,
}: ControlsBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/80 to-transparent px-4 pb-6 pt-12">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 sm:gap-3">
        <ControlButton
          icon={isMuted ? MicOff : Mic}
          label={micDisabled ? 'Mic disabled' : isMuted ? 'Unmute' : 'Mute'}
          active={isMuted}
          disabled={micDisabled}
          onClick={onToggleMic}
        />
        <ControlButton
          icon={isVideoOff ? VideoOff : Video}
          label={cameraDisabled ? 'Camera disabled' : isVideoOff ? 'Start video' : 'Stop video'}
          active={isVideoOff}
          disabled={cameraDisabled}
          onClick={onToggleVideo}
        />
        {shareDisabled ? null : (
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
        <ControlButton icon={Smile} label="Reactions" onClick={onToggleReactions} />
        <ControlButton icon={Hand} label="Raise hand" onClick={onRaiseHand} />
        {onInvite && (
          <ControlButton icon={UserPlus} label="Invite" onClick={onInvite} />
        )}
        {isModerator && onMuteAll && (
          <ControlButton icon={VolumeX} label="Mute all" onClick={onMuteAll} />
        )}
        {isHost && onToggleLock && (
          <ControlButton
            icon={isLocked ? Unlock : Lock}
            label={isLocked ? 'Unlock meeting' : 'Lock meeting'}
            active={isLocked}
            onClick={onToggleLock}
          />
        )}
        {isHost && onToggleWaitingRoom && (
          <ControlButton
            icon={DoorOpen}
            label={waitingRoomEnabled ? 'Waiting room on' : 'Waiting room off'}
            active={waitingRoomEnabled}
            onClick={onToggleWaitingRoom}
          />
        )}
        {isHost && onToggleParticipantScreenShare && (
          <ControlButton
            icon={MonitorUp}
            label={
              participantScreenShareEnabled
                ? 'Participant sharing on'
                : 'Participant sharing off'
            }
            active={participantScreenShareEnabled}
            onClick={onToggleParticipantScreenShare}
          />
        )}
        {canManageBroadcast && !isLiveStream && onGoLive && (
          <ControlButton icon={Radio} label="Start YouTube Live" onClick={onGoLive} />
        )}
        {canManageBroadcast && isLiveStream && onStopLive && (
          <ControlButton
            icon={Square}
            label={streamStopping ? 'Stopping…' : 'Stop YouTube Live'}
            danger
            onClick={onStopLive}
          />
        )}
        <ControlButton
          icon={Maximize}
          label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          active={isFullscreen}
          onClick={onToggleFullscreen}
        />

        <div className="mx-2 h-8 w-px bg-white/20" />

        {isHost && onEndMeeting && (
          <ControlButton
            icon={PhoneOff}
            label="End meeting for all"
            danger
            onClick={onEndMeeting}
          />
        )}
        <ControlButton icon={LogOut} label="Leave meeting" danger onClick={onLeave} />
      </div>
    </div>
  );
}

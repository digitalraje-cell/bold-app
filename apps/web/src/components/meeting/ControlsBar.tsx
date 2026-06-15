'use client';

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Users,
  Hand,
  Smile,
  Maximize,
  PhoneOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlsBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isFullscreen: boolean;
  activePanel: 'chat' | 'participants' | null;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleReactions: () => void;
  onRaiseHand: () => void;
  onToggleFullscreen: () => void;
  onLeave: () => void;
  isHost?: boolean;
  onEndMeeting?: () => void;
}

function ControlButton({
  icon: Icon,
  label,
  active,
  danger,
  onClick,
}: {
  icon: typeof Mic;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-12 w-12 flex-col items-center justify-center rounded-xl transition',
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
  activePanel,
  onToggleMic,
  onToggleVideo,
  onToggleShare,
  onToggleChat,
  onToggleParticipants,
  onToggleReactions,
  onRaiseHand,
  onToggleFullscreen,
  onLeave,
  isHost,
  onEndMeeting,
}: ControlsBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/80 to-transparent px-4 pb-6 pt-12">
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 sm:gap-3">
        <ControlButton
          icon={isMuted ? MicOff : Mic}
          label={isMuted ? 'Unmute' : 'Mute'}
          active={isMuted}
          onClick={onToggleMic}
        />
        <ControlButton
          icon={isVideoOff ? VideoOff : Video}
          label={isVideoOff ? 'Start video' : 'Stop video'}
          active={isVideoOff}
          onClick={onToggleVideo}
        />
        <ControlButton icon={MonitorUp} label="Share screen" onClick={onToggleShare} />
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
        <ControlButton
          icon={Maximize}
          label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          onClick={onToggleFullscreen}
        />

        <div className="mx-2 h-8 w-px bg-white/20" />

        {isHost ? (
          <ControlButton
            icon={PhoneOff}
            label="End meeting"
            danger
            onClick={onEndMeeting || onLeave}
          />
        ) : (
          <ControlButton icon={PhoneOff} label="Leave meeting" danger onClick={onLeave} />
        )}
      </div>
    </div>
  );
}

'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  MessageSquare,
  Users,
  Smile,
  PhoneOff,
  LogOut,
  MoreHorizontal,
} from 'lucide-react';
import { RoomMode } from '@boldmeet/shared';
import { MeetingLayoutMenu } from '@/components/meeting/MeetingLayoutMenu';
import { formatStreamElapsed } from '@/lib/stream-live-ui';
import { logMeetingControlsEvent } from '@/lib/media/meeting-controls-diagnostics';
import { computeMoreMenuPosition } from '@/lib/media/compute-more-menu-position';
import { cn } from '@/lib/utils';

const OUTSIDE_CLICK_GRACE_MS = 250;

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
  shareUnavailable?: boolean;
  shareUnavailableHint?: string;
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
  layoutMode?: import('@/lib/attendee-layout-prefs').StageLayout;
  onSelectLayout?: (mode: import('@/lib/attendee-layout-prefs').StageLayout) => void;
  onOpenLayoutSettings?: () => void;
  participantCount?: number;
  meetingTitle?: string | null;
  streamElapsedSeconds?: number;
  streamViewerCount?: number | null;
}

function ControlButton({
  icon: Icon,
  label,
  active,
  danger,
  disabled,
  blocked,
  onClick,
}: {
  icon: typeof Mic;
  label: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  blocked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-expanded={active}
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-all duration-200 sm:h-12 sm:w-12',
        (disabled || blocked) && 'cursor-not-allowed opacity-40',
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

function readSafeAreaTop(): number {
  if (typeof window === 'undefined') return 0;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--safe-area-inset-top')
    .trim();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function MoreOptionsDropdown({
  open,
  anchorRef,
  onClose,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  children: ReactNode;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef(0);
  const [position, setPosition] = useState({
    left: 8,
    bottom: 80,
    maxHeight: 320,
    width: 192,
  });

  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPosition(
      computeMoreMenuPosition(rect, {
        width: window.innerWidth,
        height: window.innerHeight,
      }, { safeAreaTop: readSafeAreaTop() }),
    );
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    openedAtRef.current = Date.now();
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onViewportChange = () => updatePosition();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('orientationchange', onViewportChange);

    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('orientationchange', onViewportChange);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (Date.now() - openedAtRef.current < OUTSIDE_CLICK_GRACE_MS) return;

      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;

      logMeetingControlsEvent('more-menu-outside-click', { pointerType: event.pointerType });
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown, true);
      document.addEventListener('keydown', onKeyDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [anchorRef, onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      data-more-options-menu
      role="menu"
      className="fixed z-[60] overflow-y-auto overflow-x-hidden rounded-[var(--radius-meeting)] meeting-glass-panel py-1 shadow-[var(--shadow-float)]"
      style={{
        left: position.left,
        bottom: position.bottom,
        maxHeight: position.maxHeight,
        width: position.width,
        minWidth: position.width,
      }}
    >
      {children}
    </div>,
    document.body,
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
  shareUnavailable = false,
  shareUnavailableHint,
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
  layoutMode = 'speaker',
  onSelectLayout,
  onOpenLayoutSettings,
  participantCount = 0,
  meetingTitle,
  streamElapsedSeconds = 0,
  streamViewerCount,
}: ControlsBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const hasMoreItems = true;

  const closeMoreMenu = useCallback(() => {
    setMoreOpen(false);
    setReactionsOpen(false);
    logMeetingControlsEvent('more-menu-close', {});
  }, []);

  const toggleMoreMenu = useCallback(() => {
    setMoreOpen((current) => {
      const next = !current;
      logMeetingControlsEvent('more-menu-toggle', { moreOpen: next, handlerFired: true });
      if (!next) setReactionsOpen(false);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    logMeetingControlsEvent('more-menu-open', { moreOpen: true });
  }, [moreOpen]);

  useEffect(() => {
    if (controlsVisible || !moreOpen) return;
    closeMoreMenu();
  }, [closeMoreMenu, controlsVisible, moreOpen]);

  const showShareButton = !shareDisabled || shareUnavailable;
  const shareBlocked = shareUnavailable && !isScreenSharing;
  const shareLabel = shareBlocked
    ? 'Screen sharing unavailable on this device'
    : isScreenSharing
      ? 'Stop sharing'
      : 'Share screen';

  return (
    <div
      className="pointer-events-none absolute bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10 sm:px-6 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      style={{ ['--meeting-controls-offset' as string]: '5.5rem' }}
      onMouseMove={onRevealControls}
    >
      <div
        className={cn(
          'pointer-events-auto meeting-controls-float mx-auto flex max-w-full items-center justify-center gap-1 overflow-x-auto px-2 py-2 sm:max-w-lg sm:gap-2 sm:px-3 sm:py-2.5',
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
        {showShareButton && (
          <ControlButton
            icon={isScreenSharing ? MonitorOff : MonitorUp}
            label={shareBlocked && shareUnavailableHint ? shareUnavailableHint : shareLabel}
            active={isScreenSharing}
            blocked={shareBlocked}
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

        {onSelectLayout && onOpenLayoutSettings ? (
          <MeetingLayoutMenu
            stageLayout={layoutMode}
            onSelectStageLayout={onSelectLayout}
            onOpenSettings={onOpenLayoutSettings}
          />
        ) : null}

        {hasMoreItems && (
          <div className="relative shrink-0" ref={moreRef}>
            <ControlButton
              icon={MoreHorizontal}
              label="More options"
              active={moreOpen}
              onClick={toggleMoreMenu}
            />
            <MoreOptionsDropdown open={moreOpen} anchorRef={moreRef} onClose={closeMoreMenu}>
              <MeetingInfoMenuSection
                meetingTitle={meetingTitle}
                participantCount={participantCount}
                roomMode={roomMode}
                isLiveStream={isLiveStream}
                streamElapsedSeconds={streamElapsedSeconds}
                streamViewerCount={streamViewerCount}
              />
              {reactionsEnabled && (
                <div className="border-b border-white/10 px-3 py-2">
                  <button
                    type="button"
                    role="menuitem"
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
                          role="menuitem"
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-lg hover:bg-white/20"
                          aria-label={`Send ${reaction} reaction`}
                          onClick={() => {
                            setReactionsOpen(false);
                            closeMoreMenu();
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
                    closeMoreMenu();
                    onRaiseHand();
                  }}
                />
              )}
              {onInvite && (
                <MenuItem label="Invite" onClick={() => { closeMoreMenu(); onInvite(); }} />
              )}
              {onSwitchRoomMode && roomMode && (
                <MenuItem
                  label={roomMode === RoomMode.MEETING ? 'Switch to webinar' : 'Switch to meeting'}
                  onClick={() => {
                    closeMoreMenu();
                    onSwitchRoomMode(
                      roomMode === RoomMode.MEETING ? RoomMode.WEBINAR : RoomMode.MEETING,
                    );
                  }}
                />
              )}
              <MenuItem
                label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                onClick={() => { closeMoreMenu(); onToggleFullscreen(); }}
              />
              {isModerator && onMuteAll && (
                <MenuItem label="Mute all" onClick={() => { closeMoreMenu(); onMuteAll(); }} />
              )}
              {isHost && onToggleLock && (
                <MenuItem
                  label={isLocked ? 'Unlock meeting' : 'Lock meeting'}
                  onClick={() => { closeMoreMenu(); onToggleLock(); }}
                />
              )}
              {isHost && onToggleWaitingRoom && (
                <MenuItem
                  label={waitingRoomEnabled ? 'Waiting room on' : 'Waiting room off'}
                  onClick={() => { closeMoreMenu(); onToggleWaitingRoom(); }}
                />
              )}
              {isHost && onToggleParticipantScreenShare && (
                <MenuItem
                  label={
                    participantScreenShareEnabled
                      ? 'Participant sharing on'
                      : 'Participant sharing off'
                  }
                  onClick={() => { closeMoreMenu(); onToggleParticipantScreenShare(); }}
                />
              )}
              {canManageBroadcast && !isLiveStream && onGoLive && (
                <MenuItem label="Go Live on YouTube" onClick={() => { closeMoreMenu(); onGoLive(); }} />
              )}
              {canManageBroadcast && isLiveStream && onStopLive && (
                <MenuItem
                  label={streamStopping ? 'Stopping…' : 'Stop YouTube Live'}
                  onClick={() => { closeMoreMenu(); onStopLive(); }}
                />
              )}
              {isHost && onEndMeeting && (
                <MenuItem
                  label="End meeting for all"
                  danger
                  onClick={() => { closeMoreMenu(); onEndMeeting(); }}
                />
              )}
            </MoreOptionsDropdown>
          </div>
        )}

        <div className="mx-1 h-8 w-px shrink-0 bg-white/20" />

        <ControlButton icon={LogOut} label="Leave meeting" danger onClick={onLeave} />
      </div>
    </div>
  );
}

function MeetingInfoMenuSection({
  meetingTitle,
  participantCount,
  roomMode,
  isLiveStream,
  streamElapsedSeconds,
  streamViewerCount,
}: {
  meetingTitle?: string | null;
  participantCount: number;
  roomMode?: RoomMode;
  isLiveStream?: boolean;
  streamElapsedSeconds: number;
  streamViewerCount?: number | null;
}) {
  const modeLabel =
    roomMode === RoomMode.WEBINAR
      ? 'Webinar'
      : roomMode === RoomMode.MEETING
        ? 'Meeting'
        : null;

  return (
    <div className="border-b border-white/10 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Meeting Info</p>
      <dl className="mt-2 space-y-1.5 text-sm text-white/90">
        {meetingTitle ? (
          <div className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-white/50">Title</dt>
            <dd className="min-w-0 text-right font-medium">{meetingTitle}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-white/50">Participants</dt>
          <dd className="font-medium tabular-nums">{participantCount}</dd>
        </div>
        {modeLabel ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-white/50">Mode</dt>
            <dd className="font-medium">{modeLabel}</dd>
          </div>
        ) : null}
        {isLiveStream ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-white/50">Live duration</dt>
              <dd className="font-medium tabular-nums">{formatStreamElapsed(streamElapsedSeconds)}</dd>
            </div>
            {streamViewerCount != null ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/50">Viewers</dt>
                <dd className="font-medium tabular-nums">{streamViewerCount.toLocaleString()}</dd>
              </div>
            ) : null}
          </>
        ) : null}
      </dl>
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
      role="menuitem"
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

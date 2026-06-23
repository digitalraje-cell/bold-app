'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
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
import { useMeetingControlsAutoHide } from '@/hooks/useMeetingControlsAutoHide';
import { useMeetingPageLifecycle } from '@/hooks/useMeetingPageLifecycle';
import { useAutoStageLayout } from '@/hooks/useAutoStageLayout';
import { FullscreenWrapper } from '@/components/meeting/FullscreenWrapper';
import { ControlsBar } from '@/components/meeting/ControlsBar';
import { ChatPanel } from '@/components/meeting/ChatPanel';
import { ParticipantsPanel } from '@/components/meeting/ParticipantsPanel';
import { ReactionsOverlay } from '@/components/meeting/ReactionsOverlay';
import { InviteModal } from '@/components/meeting/InviteModal';
import { HostLeaveModal } from '@/components/meeting/HostLeaveModal';
import { HostWaitingScreen } from '@/components/meeting/HostWaitingScreen';
import { MediaConnectionError } from '@/components/meeting/MediaConnectionError';
import { WebinarModeBanner } from '@/components/meeting/WebinarModeBanner';
import {
  MeetingDurationModal,
  MeetingGraceWarning,
} from '@/components/meeting/MeetingDurationModal';
import { useMeetingDuration } from '@/hooks/useMeetingDuration';
import { usePermissions } from '@/hooks/usePermissions';
import { useYouTubeLiveStream } from '@/hooks/useYouTubeLiveStream';
import { isYouTubeLiveEnabled } from '@/lib/features';
import { api } from '@/lib/api';
import { readGuestJoinSession } from '@/lib/meeting-join';
import { readJoinMediaPrefs } from '@/lib/join-media-prefs';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { YouTubeLiveModal } from '@/components/meeting/YouTubeLiveModal';
import { YouTubeLiveStatusStack } from '@/components/meeting/YouTubeLiveStatusStack';
import {
  openYoutubeWatchTab,
  shouldAutoOpenYoutubeWatchTab,
} from '@/lib/stream-live-ui';
import {
  buildMeetingControlsDiagnosticReport,
  buildMoreMenuVisibility,
  publishMeetingControlsDiagnostics,
  logMeetingControlsEvent,
} from '@/lib/media/meeting-controls-diagnostics';
import {
  detectScreenShareCapability,
  getScreenShareUnsupportedMessage,
} from '@/lib/media/screen-share-capability';

function streamPanelStorageKey(meetingId: string) {
  return `bold:stream-panel-open:${meetingId}`;
}

function clearStreamPanelStorage(meetingId: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(streamPanelStorageKey(meetingId));
}

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
  const { can, shouldShowUpgrade } = usePermissions();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useMeetingFullscreen();

  const [activePanel, setActivePanel] = useState<'chat' | 'participants' | null>(null);
  const [reactions, setReactions] = useState<{ id: string; reaction: string }[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [hostLeaveOpen, setHostLeaveOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [modeSwitching, setModeSwitching] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [raiseHandEnabled, setRaiseHandEnabled] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string>();
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [streamPanelOpen, setStreamPanelOpen] = useState(false);
  const [youtubeLiveToast, setYoutubeLiveToast] = useState(false);
  const [mediaSession, setMediaSession] = useState<{
    loading: boolean;
    jwtEnabled: boolean;
    token: string | null;
    embedDomain: string | null;
    embedRoomName: string | null;
    scriptUrl: string | null;
    moderatorPassword: string | null;
    error: string | null;
    fetchKey: number;
  }>({
    loading: true,
    jwtEnabled: false,
    token: null,
    embedDomain: null,
    embedRoomName: null,
    scriptUrl: null,
    moderatorPassword: null,
    error: null,
    fetchKey: 0,
  });

  const guestSession = typeof window !== 'undefined' ? readGuestJoinSession(meetingId) : null;
  const participantId = participantIdProp || guestSession?.participantId;
  const displayName = displayNameProp || session?.user?.name || session?.user?.email || 'Guest';
  const hangupRef = useRef<(() => void) | null>(null);
  const stopLiveRef = useRef<(options?: { silent?: boolean }) => Promise<void>>(async () => undefined);
  const meetingEndedRef = useRef(false);
  const youtubeTabOpenedRef = useRef(false);
  const notifyHostMediaReadyRef = useRef<() => void>(() => undefined);
  const notifyHostMediaLeftRef = useRef<() => void>(() => undefined);

  const {
    roomMode,
    chatMode,
    chatEnabled,
    screenShareEnabled,
    participants,
    switchRoomMode,
    bringOnStage,
    removeFromStage,
    updateChatMode,
    setScreenShareEnabled,
    isHost: isHostNow,
  } = useRoom(meetingId, session?.user?.id, isHost);

  const myParticipant =
    participants.find((p) => p.userId === session?.user?.id) ||
    (participantId ? participants.find((p) => p.id === participantId) : undefined);

  const mySocketParticipantId = myParticipant?.id ?? participantId ?? null;

  const myRole = myParticipant?.role ?? (isHostNow ? 'HOST' : 'PARTICIPANT');

  const { canJoinMedia, notifyHostMediaReady, notifyHostMediaLeft } = useMeetingPresence(
    meetingId,
    isHostNow,
    mediaSession.jwtEnabled,
  );

  useEffect(() => {
    notifyHostMediaReadyRef.current = notifyHostMediaReady;
    notifyHostMediaLeftRef.current = notifyHostMediaLeft;
  }, [notifyHostMediaReady, notifyHostMediaLeft]);
  const isModerator = myRole === 'HOST' || myRole === 'CO_HOST';
  const canAutoOpenYoutubeWatch = myRole === 'HOST' || myRole === 'CO_HOST';

  const canMic = canUseMicInRoom(myParticipant, roomMode);
  const canCamera = canUseCameraInRoom(myParticipant, roomMode);
  const canChat = canSendChatInRoom(myParticipant, roomMode, chatMode, chatEnabled);
  const canShareScreen =
    canShareScreenInRoom(myParticipant, roomMode, screenShareEnabled) ||
    (isHostNow && myRole === 'HOST' && !myParticipant);

  const screenShareCapability = useMemo(() => detectScreenShareCapability(), []);
  const shareUnavailable = canShareScreen && !screenShareCapability.supported;
  const shareUnavailableHint = shareUnavailable
    ? getScreenShareUnsupportedMessage(screenShareCapability)
    : undefined;

  const canStreamYoutube = can('canStreamToYoutube');

  const handleLeave = useCallback(
    (message?: string) => {
      if (meetingEndedRef.current) return;
      meetingEndedRef.current = true;
      hangupRef.current?.();
      const destination = session?.user ? '/dashboard' : '/join';
      router.push(message ? `${destination}?message=${encodeURIComponent(message)}` : destination);
    },
    [router, session?.user],
  );

  const handleJitsiReady = useCallback(() => {
    if (isHostNow) notifyHostMediaReadyRef.current();
  }, [isHostNow]);

  const joinMediaPrefs =
    typeof window !== 'undefined' ? readJoinMediaPrefs() : { startWithAudio: true, startWithVideo: true };

  const handleJitsiLeave = useCallback(() => {
    if (isHostNow) notifyHostMediaLeftRef.current();
    if (isModerator) {
      void stopLiveRef.current({ silent: true }).finally(() => handleLeave());
      return;
    }
    handleLeave();
  }, [isHostNow, isModerator, handleLeave]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setMediaSession((prev) => ({ ...prev, loading: true, error: null }));
      }
    });

    void api.meetings
      .getJitsiToken(meetingId, participantId ? { participantId } : undefined)
      .then((response) => {
        if (cancelled) return;
        if (response.jwtEnabled && !response.token) {
          setMediaSession((prev) => ({
            ...prev,
            loading: false,
            jwtEnabled: true,
            token: null,
            error: 'Unable to connect to meeting audio and video. Please try again.',
          }));
          return;
        }
        setMediaSession((prev) => ({
          ...prev,
          loading: false,
          jwtEnabled: response.jwtEnabled,
          token: response.token,
          embedDomain: response.domain,
          embedRoomName: response.roomName,
          scriptUrl: response.scriptUrl,
          moderatorPassword: response.moderatorPassword ?? null,
          error: null,
        }));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setMediaSession((prev) => ({
          ...prev,
          loading: false,
          error: 'Unable to connect to meeting audio and video. Please try again.',
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId, participantId, mediaSession.fetchKey]);

  const handleMediaError = useCallback((message: string) => {
    setMediaSession((prev) => ({ ...prev, error: message }));
  }, []);

  const retryMediaSession = useCallback(() => {
    setMediaSession((prev) => ({
      ...prev,
      loading: true,
      error: null,
      fetchKey: prev.fetchKey + 1,
    }));
  }, []);

  const mediaReady =
    canJoinMedia &&
    !mediaSession.loading &&
    !mediaSession.error &&
    Boolean(mediaSession.embedRoomName) &&
    (mediaSession.jwtEnabled ? Boolean(mediaSession.token) : true);

  const showHostWait = !canJoinMedia && !mediaSession.error && !mediaSession.loading;
  const showMediaLoading = canJoinMedia && mediaSession.loading && !mediaSession.error;

  const {
    toggleAudio,
    toggleVideo,
    toggleShareScreen,
    hangup,
    muteAll,
    isScreenSharing,
    isPresenterLayout,
    isAudioMuted,
    isVideoMuted,
    isReconnecting,
    setTileView,
    setFilmstripVisible,
    setSelfViewHidden,
    runJitsiCommand,
  } = useJitsi({
    roomName: mediaSession.embedRoomName ?? jitsiRoom,
    jitsiDomain: mediaSession.embedDomain ?? undefined,
    scriptUrl: mediaSession.scriptUrl ?? undefined,
    displayName,
    isHost: isHostNow,
    isModerator,
    jwt: mediaSession.token,
    jwtEnabled: mediaSession.jwtEnabled,
    moderatorPassword: mediaSession.moderatorPassword,
    enabled: mediaReady,
    // Bold gates sharing in controls; keep Jitsi embed stable when host toggles permissions.
    allowDesktopSharing: true,
    containerRef,
    onReady: handleJitsiReady,
    onLeave: handleJitsiLeave,
    onMediaError: handleMediaError,
    startMuted: !joinMediaPrefs.startWithAudio,
    startVideoMuted: !joinMediaPrefs.startWithVideo,
  });

  const youtubeCaptureContext = useMemo(
    () => ({
      isScreenSharing,
      isPresenterLayout,
      roomMode,
    }),
    [isScreenSharing, isPresenterLayout, roomMode],
  );

  const {
    broadcastStatus: streamBroadcastStatus,
    isLive: isLiveStream,
    displayStatus: streamDisplayStatus,
    connectionState: streamConnectionState,
    streamHealth,
    watchUrl: liveWatchUrl,
    destinations: streamDestinations,
    streamTitle,
    viewerCount: streamViewerCount,
    streamVisibility,
    elapsedSeconds: streamElapsedSeconds,
    starting: streamStarting,
    resuming: streamResuming,
    stopping: streamStopping,
    error: streamError,
    pendingResume: streamPendingResume,
    captureActive: streamCaptureActive,
    startLive,
    resumeLive,
    stopLive,
    loadModeratorState,
    setError: setStreamError,
  } = useYouTubeLiveStream(meetingId, youtubeCaptureContext, containerRef);

  useEffect(() => {
    stopLiveRef.current = stopLive;
  }, [stopLive]);

  useEffect(() => {
    if (isModerator && isYouTubeLiveEnabled() && canStreamYoutube) {
      void loadModeratorState();
    }
  }, [isModerator, loadModeratorState, canStreamYoutube]);

  useEffect(() => {
    hangupRef.current = hangup;
  }, [hangup]);

  const jitsiLayoutApi = useMemo(
    () => ({
      setTileView,
      setFilmstripVisible,
      setSelfViewHidden,
      runJitsiCommand,
      mediaReady,
    }),
    [setTileView, setFilmstripVisible, setSelfViewHidden, runJitsiCommand, mediaReady],
  );

  const stageContext = useMemo(
    () => ({
      isScreenSharing,
      isPresenterLayout,
      roomMode,
      isYoutubeLiveCapturing:
        streamCaptureActive ||
        isLiveStream ||
        streamStarting ||
        streamDisplayStatus === 'CONNECTING',
    }),
    [
      isScreenSharing,
      isPresenterLayout,
      roomMode,
      streamCaptureActive,
      isLiveStream,
      streamStarting,
      streamDisplayStatus,
    ],
  );

  const { shellClassName } = useAutoStageLayout(jitsiLayoutApi, stageContext);

  const controlsPinned =
    activePanel !== null ||
    inviteOpen ||
    hostLeaveOpen ||
    youtubeModalOpen ||
    upgradeOpen;

  const { controlsVisible, revealControls, toggleControlsMobile } = useMeetingControlsAutoHide(
    controlsPinned,
    true,
  );

  useMeetingPageLifecycle(mediaReady, revealControls);

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

  const stopStreamBeforeLeave = useCallback(async () => {
    if (!isModerator) return;
    if (isLiveStream || streamPendingResume || streamDisplayStatus === 'CONNECTING') {
      await stopLive({ silent: true }).catch(() => undefined);
    }
  }, [isModerator, isLiveStream, streamPendingResume, streamDisplayStatus, stopLive]);

  const handleLeaveMeeting = useCallback(async () => {
    setLeaveLoading(true);
    try {
      await stopStreamBeforeLeave();
      if (participantId && !session?.user?.id) {
        await api.meetings.leaveGuest(meetingId, participantId);
      } else {
        await api.meetings.leave(meetingId);
      }
    } catch {
      // Still leave the call if the API fails
    } finally {
      setLeaveLoading(false);
      setHostLeaveOpen(false);
      hangupRef.current?.();
      handleLeave();
    }
  }, [
    meetingId,
    participantId,
    session?.user?.id,
    handleLeave,
    stopStreamBeforeLeave,
  ]);

  const handleEndMeetingForAll = useCallback(async () => {
    setLeaveLoading(true);
    try {
      await stopStreamBeforeLeave();
      await api.meetings.end(meetingId);
    } catch {
      // Still leave the call if the API fails
    } finally {
      setLeaveLoading(false);
      setHostLeaveOpen(false);
      handleLeave();
    }
  }, [meetingId, handleLeave, stopStreamBeforeLeave]);

  const { emit, on } = useSocket(meetingId);

  useEffect(() => {
    if (!mySocketParticipantId || !mediaReady) return;
    emit('participant:media', {
      participantId: mySocketParticipantId,
      isMuted: isAudioMuted,
      isVideoOff: isVideoMuted,
    });
  }, [emit, mySocketParticipantId, isAudioMuted, isVideoMuted, mediaReady]);

  useEffect(() => {
    api.meetings
      .get(meetingId)
      .then((meeting) => {
        const m = meeting as {
          isLocked?: boolean;
          settings?: {
            waitingRoomEnabled?: boolean;
            screenShareEnabled?: boolean;
            reactionsEnabled?: boolean;
            raiseHandEnabled?: boolean;
          };
        };
        if (myRole === 'HOST') {
          setIsLocked(Boolean(m.isLocked));
          setWaitingRoomEnabled(Boolean(m.settings?.waitingRoomEnabled));
        }
        setReactionsEnabled(m.settings?.reactionsEnabled ?? true);
        setRaiseHandEnabled(m.settings?.raiseHandEnabled ?? true);
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

    const unsubReaction = on('reaction:send', (data: unknown) => {
      const { reaction } = data as { reaction?: string };
      if (!reaction) return;
      const id = `${Date.now()}-${Math.random()}`;
      setReactions((prev) => [...prev, { id, reaction }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    });

    return () => {
      unsubEnded?.();
      unsubLeft?.();
      unsubReaction?.();
    };
  }, [on, handleLeave, participantId, mySocketParticipantId]);

  useEffect(() => {
    if (roomMode === RoomMode.WEBINAR && myParticipant && !canMic && !isAudioMuted) {
      toggleAudio();
    }
  }, [roomMode, myParticipant, canMic, isAudioMuted, toggleAudio]);

  useEffect(() => {
    if (roomMode === RoomMode.WEBINAR && myParticipant && !canCamera && !isVideoMuted) {
      toggleVideo();
    }
  }, [roomMode, myParticipant, canCamera, isVideoMuted, toggleVideo]);

  const handRaised = Boolean(myParticipant?.handRaised);

  const handleToggleMic = () => {
    if (!canMic) return;
    toggleAudio();
  };

  const handleToggleVideo = () => {
    if (!canCamera) return;
    toggleVideo();
  };

  const handleToggleShare = () => {
    logMeetingControlsEvent('screen-share-attempt', {
      userRole: myRole,
      canShareScreenByRole: canShareScreen,
      shareUnavailable,
    });

    if (!canShareScreen) {
      const message = screenShareEnabled
        ? 'Screen sharing is not available for your role'
        : 'The host has not allowed participant screen sharing';
      logMeetingControlsEvent('screen-share-blocked', { reason: 'role', message });
      setShareError(message);
      setTimeout(() => setShareError(null), 4000);
      return;
    }

    if (!screenShareCapability.supported) {
      const message = getScreenShareUnsupportedMessage(screenShareCapability);
      logMeetingControlsEvent('screen-share-blocked', { reason: 'browser', message });
      setShareError(message);
      setTimeout(() => setShareError(null), 6000);
      return;
    }

    setShareError(null);
    toggleShareScreen();
  };

  const handleRaiseHand = () => {
    if (!mySocketParticipantId) return;
    const next = !handRaised;
    emit(next ? 'hand:raise' : 'hand:lower', {
      participantId: mySocketParticipantId,
      displayName,
    });
  };

  const handleReaction = (reaction: string) => {
    if (!mySocketParticipantId) return;
    emit('reaction:send', { participantId: mySocketParticipantId, reaction });
  };

  const handleSwitchRoomMode = async (mode: RoomMode) => {
    if (mode === roomMode) return;
    if (mode === RoomMode.WEBINAR && shouldShowUpgrade && !can('canSwitchRoomMode')) {
      setUpgradeFeature('Webinar mode');
      setUpgradeOpen(true);
      return;
    }
    setModeSwitching(true);
    try {
      await switchRoomMode(mode);
    } finally {
      setModeSwitching(false);
    }
  };

  const handleGoLive = () => {
    if (shouldShowUpgrade && !can('canStreamToYoutube')) {
      setUpgradeFeature('YouTube Live streaming');
      setUpgradeOpen(true);
      return;
    }
    if (!isYouTubeLiveEnabled()) {
      setShareError('YouTube Live has been disabled on this deployment.');
      return;
    }
    setYoutubeModalOpen(true);
  };

  const handleRetryStream = useCallback(() => {
    setStreamError(null);
    void resumeLive();
  }, [resumeLive, setStreamError]);

  const handleStartLiveAgain = useCallback(async () => {
    setStreamError(null);
    if (
      streamBroadcastStatus === 'LIVE' ||
      streamBroadcastStatus === 'ERROR' ||
      streamPendingResume
    ) {
      await stopLive();
    }
    setYoutubeModalOpen(true);
  }, [setStreamError, stopLive, streamBroadcastStatus, streamPendingResume]);

  const handleCopyWatchUrl = useCallback(async () => {
    if (!liveWatchUrl) throw new Error('No watch URL');
    try {
      await navigator.clipboard.writeText(liveWatchUrl);
    } catch {
      throw new Error('Could not copy watch URL');
    }
  }, [liveWatchUrl]);

  const handleOpenYouTube = useCallback(() => {
    if (liveWatchUrl) window.open(liveWatchUrl, '_blank', 'noopener,noreferrer');
  }, [liveWatchUrl]);

  const handleHideStreamPanel = useCallback(() => {
    setStreamPanelOpen(false);
    sessionStorage.setItem(streamPanelStorageKey(meetingId), 'closed');
  }, [meetingId]);

  const handleShowStreamPanel = useCallback(() => {
    setStreamPanelOpen(true);
    sessionStorage.removeItem(streamPanelStorageKey(meetingId));
  }, [meetingId]);

  const hasYoutubeOverlayOffset = isScreenSharing || isPresenterLayout;

  const hasYoutubeLiveViewerSignal =
    streamViewerCount != null ||
    streamDestinations.some((destination) => destination.viewerCount != null);

  const promptYoutubeWatchOpen = useCallback(() => {
    if (!liveWatchUrl || youtubeTabOpenedRef.current) return;
    youtubeTabOpenedRef.current = true;

    if (shouldAutoOpenYoutubeWatchTab()) {
      const opened = openYoutubeWatchTab(liveWatchUrl);
      if (!opened) {
        setYoutubeLiveToast(true);
      }
      return;
    }

    setYoutubeLiveToast(true);
  }, [liveWatchUrl]);

  const handleYoutubeLiveToastOpen = useCallback(() => {
    if (!liveWatchUrl) return;
    openYoutubeWatchTab(liveWatchUrl);
    setYoutubeLiveToast(false);
  }, [liveWatchUrl]);

  useEffect(() => {
    if (!canAutoOpenYoutubeWatch || !liveWatchUrl || youtubeTabOpenedRef.current || !isLiveStream) return;

    if (hasYoutubeLiveViewerSignal) {
      queueMicrotask(() => promptYoutubeWatchOpen());
      return;
    }

    if (!streamCaptureActive || streamConnectionState !== 'connected') return;

    const timer = window.setTimeout(() => {
      queueMicrotask(() => promptYoutubeWatchOpen());
    }, 15_000);

    return () => window.clearTimeout(timer);
  }, [
    canAutoOpenYoutubeWatch,
    liveWatchUrl,
    isLiveStream,
    hasYoutubeLiveViewerSignal,
    streamCaptureActive,
    streamConnectionState,
    promptYoutubeWatchOpen,
  ]);

  useEffect(() => {
    if (!isLiveStream) return;
    setStreamPanelOpen(false);
  }, [isLiveStream]);

  useEffect(() => {
    if (isLiveStream) return;
    youtubeTabOpenedRef.current = false;
    queueMicrotask(() => {
      setYoutubeLiveToast(false);
      setStreamPanelOpen(false);
      clearStreamPanelStorage(meetingId);
    });
  }, [isLiveStream, meetingId]);

  useEffect(() => {
    if (streamDisplayStatus !== 'OFFLINE') return;
    queueMicrotask(() => {
      setYoutubeLiveToast(false);
      setStreamPanelOpen(false);
      clearStreamPanelStorage(meetingId);
    });
  }, [streamDisplayStatus, meetingId]);

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

  useEffect(() => {
    if (!mediaReady) return;

    const isHostRole = myRole === 'HOST';
    const noop = () => undefined;
    const visibility = buildMoreMenuVisibility({
      reactionsEnabled,
      raiseHandEnabled,
      canManageBroadcast: isModerator,
      onGoLive: isModerator ? noop : undefined,
      onInvite: isModerator ? noop : undefined,
      onSwitchRoomMode: isModerator ? noop : undefined,
      onMuteAll: isModerator ? noop : undefined,
      onToggleLock: isHostRole ? noop : undefined,
      onToggleWaitingRoom: isHostRole ? noop : undefined,
      onToggleParticipantScreenShare: isHostRole ? noop : undefined,
      onEndMeeting: isHostRole ? noop : undefined,
      isHost: isHostRole,
      isModerator,
    });

    publishMeetingControlsDiagnostics(
      buildMeetingControlsDiagnosticReport({
        userRole: myRole,
        isHost: isHostRole,
        isModerator,
        moreOpen: false,
        hasMoreItems:
          reactionsEnabled ||
          raiseHandEnabled ||
          isModerator ||
          isHostRole ||
          true,
        visibility,
        canShareScreenByRole: canShareScreen,
      }),
    );
  }, [mediaReady, myRole, isModerator, reactionsEnabled, raiseHandEnabled, canShareScreen]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0f172a]">
      {showHostWait && <HostWaitingScreen meetingId={meetingId} title={title} />}

      {showMediaLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 px-6 text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
          <p className="text-sm text-white/70">Connecting to meeting…</p>
        </div>
      )}

      {mediaSession.error && (
        <MediaConnectionError
          meetingId={meetingId}
          message={mediaSession.error}
          onRetry={retryMediaSession}
        />
      )}

      <div
        ref={containerRef}
        data-meeting-stage
        className={`meeting-jitsi-shell ${shellClassName} absolute inset-0 min-h-[200px] touch-manipulation bg-[#0f172a] [&_iframe]:min-h-full [&_iframe]:w-full [&_iframe]:border-0 [&_iframe]:bg-[#0f172a] ${
          !mediaReady ? 'invisible pointer-events-none' : ''
        }`}
      />

      {!controlsVisible && !controlsPinned && mediaReady ? (
        <button
          type="button"
          className="absolute inset-0 z-20 bg-transparent md:hidden"
          aria-label="Show meeting controls"
          onClick={toggleControlsMobile}
        />
      ) : null}

      <ReactionsOverlay reactions={reactions} />
      {!isLiveStream && <WebinarModeBanner roomMode={roomMode} />}

      {shouldShowUpgrade && (
        <UpgradeModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          feature={upgradeFeature}
        />
      )}

      <YouTubeLiveModal
        open={youtubeModalOpen}
        meetingId={meetingId}
        onClose={() => setYoutubeModalOpen(false)}
        loading={streamStarting}
        onStart={startLive}
        offsetBelowHeader={hasYoutubeOverlayOffset}
      />

      <YouTubeLiveStatusStack
        offsetBelowHeader={hasYoutubeOverlayOffset}
        noticeMessage={shareError}
        isModerator={isModerator}
        isLiveStream={isLiveStream}
        streamDisplayStatus={streamDisplayStatus}
        streamPanelOpen={streamPanelOpen}
        streamPendingResume={streamPendingResume}
        youtubeModalOpen={youtubeModalOpen}
        streamResuming={streamResuming}
        streamError={streamError}
        streamConnectionState={streamConnectionState}
        streamHealth={streamHealth}
        streamElapsedSeconds={streamElapsedSeconds}
        streamViewerCount={streamViewerCount}
        streamVisibility={streamVisibility}
        streamTitle={streamTitle}
        liveWatchUrl={liveWatchUrl}
        streamDestinations={streamDestinations}
        streamStopping={streamStopping}
        youtubeLiveToast={youtubeLiveToast}
        onResume={() => void resumeLive()}
        onStopLive={() => void stopLive()}
        onShowStreamPanel={handleShowStreamPanel}
        onHideStreamPanel={handleHideStreamPanel}
        onCopyWatchUrl={() => handleCopyWatchUrl()}
        onOpenYouTube={handleOpenYouTube}
        onRetryStream={handleRetryStream}
        onStartLiveAgain={() => void handleStartLiveAgain()}
        onYoutubeLiveToastOpen={handleYoutubeLiveToastOpen}
        onDismissYoutubeLiveToast={() => setYoutubeLiveToast(false)}
      />

      {isReconnecting && mediaReady && (
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
          Reconnecting…
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
              senderId: mySocketParticipantId,
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
          onBringOnStage={isModerator ? bringOnStage : undefined}
          onRemoveFromStage={isModerator ? removeFromStage : undefined}
          onMuteAll={isModerator ? muteAll : undefined}
        />
      )}

      <div className="pointer-events-none absolute left-2 top-2 z-30 flex max-w-[calc(100%-1rem)] flex-col gap-2 sm:left-4 sm:top-4">
        {!isLiveStream && (
          <div className="pointer-events-auto max-w-[min(100%,16rem)] truncate rounded-lg bg-black/50 px-2 py-1 text-xs text-white backdrop-blur sm:max-w-none sm:px-3 sm:py-1.5 sm:text-sm">
            {title}
          </div>
        )}
      </div>

      <ControlsBar
        isMuted={isAudioMuted}
        isVideoOff={isVideoMuted}
        isFullscreen={isFullscreen}
        isScreenSharing={isScreenSharing}
        activePanel={activePanel}
        micDisabled={!canMic}
        cameraDisabled={!canCamera}
        shareDisabled={!canShareScreen}
        shareUnavailable={shareUnavailable}
        shareUnavailableHint={shareUnavailableHint}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
        onToggleShare={handleToggleShare}
        onToggleChat={() => setActivePanel((p) => (p === 'chat' ? null : 'chat'))}
        onToggleParticipants={() =>
          setActivePanel((p) => (p === 'participants' ? null : 'participants'))
        }
        onReaction={handleReaction}
        onRaiseHand={handleRaiseHand}
        handRaised={handRaised}
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
        onEndMeeting={myRole === 'HOST' ? () => setHostLeaveOpen(true) : undefined}
        onMuteAll={isModerator ? muteAll : undefined}
        isLocked={isLocked}
        onToggleLock={myRole === 'HOST' ? handleToggleLock : undefined}
        waitingRoomEnabled={waitingRoomEnabled}
        onToggleWaitingRoom={myRole === 'HOST' ? handleToggleWaitingRoom : undefined}
        participantScreenShareEnabled={screenShareEnabled}
        onToggleParticipantScreenShare={
          myRole === 'HOST' ? handleToggleParticipantScreenShare : undefined
        }
        roomMode={roomMode}
        onSwitchRoomMode={isModerator ? handleSwitchRoomMode : undefined}
        reactionsEnabled={reactionsEnabled}
        raiseHandEnabled={raiseHandEnabled}
        isLiveStream={isLiveStream}
        onGoLive={isModerator ? handleGoLive : undefined}
        onStopLive={isModerator ? () => void stopLive() : undefined}
        streamStopping={streamStopping}
        canManageBroadcast={isModerator}
        controlsVisible={controlsVisible}
        onRevealControls={revealControls}
        participantCount={participants.length}
        meetingTitle={title}
        streamElapsedSeconds={streamElapsedSeconds}
        streamViewerCount={streamViewerCount}
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

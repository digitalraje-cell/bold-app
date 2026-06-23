'use client';

import type {
  LiveStreamDestinationView,
  StreamConnectionState,
  StreamDisplayStatus,
  YouTubePrivacyStatus,
} from '@boldmeet/shared';
import { StreamLivePill } from '@/components/meeting/StreamLivePill';
import { StreamStatusPanel } from '@/components/meeting/StreamStatusPanel';
import { YouTubeLiveErrorCard } from '@/components/meeting/YouTubeLiveErrorCard';
import { YouTubeLiveOpenToast } from '@/components/meeting/YouTubeLiveOpenToast';
import { YouTubeLiveResumeBanner } from '@/components/meeting/YouTubeLiveResumeBanner';
import {
  YOUTUBE_OVERLAY_STACK_CLASS,
  YOUTUBE_TOAST_CLASS,
  youtubeOverlayStackTopClass,
} from '@/lib/meeting-youtube-overlay-layout';
import { cn } from '@/lib/utils';

interface YouTubeLiveStatusStackProps {
  offsetBelowHeader?: boolean;
  noticeMessage?: string | null;
  isModerator: boolean;
  isLiveStream: boolean;
  streamDisplayStatus: StreamDisplayStatus;
  streamPanelOpen: boolean;
  streamPendingResume: boolean;
  youtubeModalOpen: boolean;
  streamResuming: boolean;
  streamError: string | null;
  streamConnectionState: StreamConnectionState;
  streamHealth: 'healthy' | 'degraded' | 'offline';
  streamElapsedSeconds: number;
  streamViewerCount?: number | null;
  streamVisibility?: YouTubePrivacyStatus | null;
  streamTitle?: string | null;
  liveWatchUrl?: string | null;
  streamDestinations: LiveStreamDestinationView[];
  streamStopping: boolean;
  youtubeLiveToast: boolean;
  onResume: () => void;
  onStopLive: () => void;
  onShowStreamPanel: () => void;
  onHideStreamPanel: () => void;
  onCopyWatchUrl: () => void | Promise<void>;
  onOpenYouTube: () => void;
  onRetryStream: () => void;
  onStartLiveAgain: () => void;
  onYoutubeLiveToastOpen: () => void;
  onDismissYoutubeLiveToast: () => void;
}

export function YouTubeLiveStatusStack({
  offsetBelowHeader,
  noticeMessage,
  isModerator,
  isLiveStream,
  streamDisplayStatus,
  streamPanelOpen,
  streamPendingResume,
  youtubeModalOpen,
  streamResuming,
  streamError,
  streamConnectionState,
  streamHealth,
  streamElapsedSeconds,
  streamViewerCount,
  streamVisibility,
  streamTitle,
  liveWatchUrl,
  streamDestinations,
  streamStopping,
  youtubeLiveToast,
  onResume,
  onStopLive,
  onShowStreamPanel,
  onHideStreamPanel,
  onCopyWatchUrl,
  onOpenYouTube,
  onRetryStream,
  onStartLiveAgain,
  onYoutubeLiveToastOpen,
  onDismissYoutubeLiveToast,
}: YouTubeLiveStatusStackProps) {
  const showModeratorStream = isModerator && streamDisplayStatus !== 'OFFLINE';
  const showErrorCard = Boolean(streamError && isModerator && !streamPanelOpen);
  const showPaused = isModerator && streamPendingResume && !youtubeModalOpen;
  const showWatchToast = isModerator && youtubeLiveToast && Boolean(liveWatchUrl);
  const hasContent =
    Boolean(noticeMessage) ||
    (!youtubeModalOpen &&
      (showPaused ||
        showWatchToast ||
        showErrorCard ||
        showModeratorStream ||
        (isLiveStream && !isModerator)));

  if (!hasContent) return null;

  return (
    <div
      className={cn(
        YOUTUBE_OVERLAY_STACK_CLASS,
        youtubeOverlayStackTopClass(offsetBelowHeader),
      )}
    >
      {noticeMessage ? <MeetingNoticeToast message={noticeMessage} /> : null}

      {!youtubeModalOpen && showPaused && (
        <YouTubeLiveResumeBanner
          loading={streamResuming}
          onResume={onResume}
          onStop={onStopLive}
        />
      )}

      {!youtubeModalOpen && showWatchToast && (
        <YouTubeLiveOpenToast onOpen={onYoutubeLiveToastOpen} onDismiss={onDismissYoutubeLiveToast} />
      )}

      {!youtubeModalOpen && showErrorCard && streamError && (
        <YouTubeLiveErrorCard
          message={streamError}
          onRetry={onRetryStream}
          onStartLiveAgain={onStartLiveAgain}
          retryLoading={streamResuming}
        />
      )}

      {!youtubeModalOpen && showModeratorStream &&
        (streamPanelOpen ? (
          <StreamStatusPanel
            displayStatus={streamDisplayStatus}
            connectionState={streamConnectionState}
            streamHealth={streamHealth}
            elapsedSeconds={streamElapsedSeconds}
            viewerCount={streamViewerCount}
            visibility={streamVisibility}
            title={streamTitle}
            watchUrl={liveWatchUrl}
            destinations={streamDestinations}
            error={streamError}
            stopping={streamStopping}
            onClose={onHideStreamPanel}
            onCopyWatchUrl={onCopyWatchUrl}
            onOpenYouTube={onOpenYouTube}
            onStopLive={onStopLive}
            onRetry={onRetryStream}
            onStartLiveAgain={onStartLiveAgain}
            retryLoading={streamResuming}
          />
        ) : (
          <StreamLivePill displayStatus={streamDisplayStatus} onClick={onShowStreamPanel} />
        ))}

      {!youtubeModalOpen && isLiveStream && !isModerator && (
        <StreamLivePill displayStatus="LIVE" />
      )}
    </div>
  );
}

export function MeetingNoticeToast({
  message,
  tone = 'warning',
  className,
}: {
  message: string;
  tone?: 'warning' | 'info';
  className?: string;
}) {
  return (
    <div
      className={cn(
        YOUTUBE_TOAST_CLASS,
        tone === 'warning' ? 'border-amber-500/40 bg-amber-950/90 text-amber-50' : '',
        className,
      )}
      role="status"
    >
      <p className="text-xs leading-relaxed sm:text-sm">{message}</p>
    </div>
  );
}

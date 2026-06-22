/**
 * Outbound broadcast destination — Bold owns metadata & permissions.
 * FFmpeg RTMP relay (Phase 1.5); OAuth/Jibri/LiveKit egress later.
 */
export enum MeetingBroadcastProviderType {
  NONE = 'NONE',
  YOUTUBE_RTMP = 'YOUTUBE_RTMP',
  CUSTOM_RTMP = 'CUSTOM_RTMP',
}

/** @deprecated use MeetingBroadcastProviderType */
export { MeetingBroadcastProviderType as StreamingProviderType };

export const DEFAULT_YOUTUBE_RTMP_URL = 'rtmp://a.rtmp.youtube.com/live2';

export type BroadcastStatus = 'IDLE' | 'LIVE' | 'ENDED' | 'ERROR';

/** UI-facing stream indicator for meeting controls. */
export type StreamDisplayStatus = 'OFFLINE' | 'CONNECTING' | 'LIVE' | 'ERROR';

export type StreamConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface StartLiveStreamInput {
  meetingId: string;
  hostUserId: string;
  provider: MeetingBroadcastProviderType;
  title: string;
  rtmpUrl: string;
  streamKey: string;
  watchUrl?: string;
}

export interface LiveStreamDestinationView {
  id: string;
  youtubeAccountId: string | null;
  channelName: string | null;
  watchUrl: string | null;
  status: BroadcastStatus;
  viewerCount?: number | null;
}

export interface StreamIngestSession {
  id: string;
  ingestToken: string;
  watchUrl?: string | null;
  channelName?: string | null;
  youtubeAccountId?: string | null;
}

export interface LiveStreamSessionView {
  id: string;
  meetingId: string;
  provider: MeetingBroadcastProviderType;
  status: BroadcastStatus;
  title?: string | null;
  watchUrl?: string | null;
  rtmpUrl?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  /** Server ffmpeg relay is accepting ingest chunks */
  relayActive?: boolean;
  /** Host browser can reconnect capture after refresh */
  canResume?: boolean;
  /** Client is actively sending media to the relay */
  captureActive?: boolean;
  /** Concurrent viewers from YouTube API (when available) */
  viewerCount?: number | null;
  visibility?: 'public' | 'unlisted' | 'private' | null;
  /** One row per connected YouTube channel (multi-destination on Max) */
  destinations?: LiveStreamDestinationView[];
}

/** Host/co-host response when a relay session starts */
export interface StartLiveStreamResult extends LiveStreamSessionView {
  /** Primary ingest token (first destination) */
  ingestToken: string;
  /** All relay sessions — browser fans capture to each ingest */
  sessions: StreamIngestSession[];
}

export interface PublicLiveStreamView {
  isLive: boolean;
  status?: BroadcastStatus;
  title?: string | null;
  watchUrl?: string | null;
  startedAt?: string | null;
  provider?: MeetingBroadcastProviderType;
}

export interface MeetingBroadcastProvider {
  readonly type: MeetingBroadcastProviderType;
  validateInput(input: Pick<StartLiveStreamInput, 'rtmpUrl' | 'streamKey'>): string | null;
  normalizeRtmpUrl(rtmpUrl: string): string;
  buildOutputUrl(rtmpUrl: string, streamKey: string): string;
}

/** @deprecated use MeetingBroadcastProvider */
export type StreamingProvider = MeetingBroadcastProvider;

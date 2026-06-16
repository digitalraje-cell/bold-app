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

export interface StartLiveStreamInput {
  meetingId: string;
  hostUserId: string;
  provider: MeetingBroadcastProviderType;
  title: string;
  rtmpUrl: string;
  streamKey: string;
  watchUrl?: string;
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
}

/** Host/co-host response when a relay session starts */
export interface StartLiveStreamResult extends LiveStreamSessionView {
  ingestToken: string;
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

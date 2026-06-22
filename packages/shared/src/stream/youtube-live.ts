export type YouTubePrivacyStatus = 'public' | 'unlisted' | 'private';

export type YouTubeChannelStatus = 'live_enabled' | 'activation_required';

export interface YouTubeChannelAccount {
  id: string;
  channelId: string;
  name: string;
  url: string | null;
  channelAvatar: string | null;
  gmailAccount: string | null;
  liveStreamingEnabled: boolean;
  status: YouTubeChannelStatus;
  /** @deprecated use status */
  eligibilityCheckedAt: string | null;
  lastValidatedAt: string | null;
  connectedAt: string;
  activationUrl: string;
  learnMoreUrl: string;
}

export interface YoutubePlanLimitsView {
  maxChannels: number;
  maxSimultaneousDestinations: number;
  tierLabel: string;
  upgradePlanLabel: string | null;
  canAddChannel: boolean;
  channelCount: number;
  maxPlanComingSoon: boolean;
}

export interface YouTubeConnectionStatus {
  connected: boolean;
  oauthConfigured: boolean;
  accounts: YouTubeChannelAccount[];
  limits: YoutubePlanLimitsView;
  /** @deprecated use accounts */
  channel?: YouTubeChannelAccount | null;
  message: string;
}

export interface StartYouTubeLiveInput {
  provider: 'YOUTUBE_RTMP';
  youtubeAccountIds: string[];
  visibility?: YouTubePrivacyStatus;
}

export interface MeetingLiveStreamView {
  isLive: boolean;
  destinations: import('./types').LiveStreamDestinationView[];
  title?: string | null;
  visibility?: YouTubePrivacyStatus | null;
  startedAt?: string | null;
}

export const YOUTUBE_LIVE_LEARN_MORE_URL =
  'https://support.google.com/youtube/answer/2853702';

/** Shown when a connected channel has not completed YouTube live activation. */
export const YOUTUBE_LIVE_ACTIVATION_MESSAGE =
  'Live streaming is not enabled on this channel. Enable it in YouTube Studio. Activation may take up to 24 hours.';

export function buildYouTubeActivationUrl(channelId: string): string {
  return `https://studio.youtube.com/channel/${channelId}/livestreaming`;
}

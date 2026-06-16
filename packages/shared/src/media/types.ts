/**
 * Media transport is pluggable (Jitsi today; LiveKit/Mediasoup later).
 * Bold owns permissions, roles, and UX — the provider only moves A/V bits.
 */
export type MediaProviderName = 'jitsi' | 'livekit' | 'mediasoup';

export interface MeetingMediaSessionConfig {
  roomName: string;
  displayName: string;
  /** Bold HOST role — first media joiner when host is present in Bold room */
  isHost: boolean;
  startAudioMuted?: boolean;
  startVideoMuted?: boolean;
  /** When false, Jitsi desktop sharing is disabled for this embed */
  allowDesktopSharing?: boolean;
}

export interface MeetingMediaEmbedOptions {
  domain: string;
  roomName: string;
  displayName: string;
  configOverwrite: Record<string, unknown>;
  interfaceConfigOverwrite: Record<string, unknown>;
  userInfo: { displayName: string };
}

export interface MeetingMediaProvider {
  readonly name: MediaProviderName;
  getDefaultDomain(): string;
  getExternalApiScriptUrl(domain: string): string;
  buildEmbedOptions(config: MeetingMediaSessionConfig): MeetingMediaEmbedOptions;
}

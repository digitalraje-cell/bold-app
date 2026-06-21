/**
 * Media transport is pluggable (Jitsi today; LiveKit/Mediasoup later).
 * Bold owns permissions, roles, and UX — the provider only moves A/V bits.
 */
export type MediaProviderName = 'jitsi' | 'livekit' | 'mediasoup';

export interface MeetingMediaSessionConfig {
  roomName: string;
  displayName: string;
  /** Bold HOST role — used for lobby toggles when JWT is not enabled */
  isHost: boolean;
  /** Bold moderator (HOST or CO_HOST) — encoded in JWT when jwtEnabled */
  isModerator?: boolean;
  startAudioMuted?: boolean;
  startVideoMuted?: boolean;
  /** When false, Jitsi desktop sharing is disabled for this embed */
  allowDesktopSharing?: boolean;
  /** Signed Jitsi JWT from Bold API — suppresses Jitsi login/moderator screens */
  jwt?: string | null;
  jwtEnabled?: boolean;
}

export interface MeetingMediaEmbedOptions {
  domain: string;
  roomName: string;
  displayName: string;
  jwt?: string;
  configOverwrite: Record<string, unknown>;
  interfaceConfigOverwrite: Record<string, unknown>;
  userInfo: { displayName: string; email?: string };
}

export interface MeetingMediaProvider {
  readonly name: MediaProviderName;
  getDefaultDomain(): string;
  getExternalApiScriptUrl(domain: string): string;
  buildEmbedOptions(config: MeetingMediaSessionConfig): MeetingMediaEmbedOptions;
}

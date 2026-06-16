import type {
  MeetingMediaEmbedOptions,
  MeetingMediaProvider,
  MeetingMediaSessionConfig,
} from '@boldmeet/shared';

/**
 * Default public Jitsi instance for MVP embeds.
 * Guests wait for host media-ready (useMeetingPresence) so the host joins first.
 */
const DEFAULT_JITSI_DOMAIN = 'meet.jit.si';

/** Instances that block cross-origin iframe embeds (X-Frame-Options / CSP). */
const BLOCKED_EMBED_DOMAINS = new Set(['meet.ffmuc.net']);

function normalizeDomain(value: string): string {
  return value.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
}

export function getJitsiDomain(): string {
  const configured = process.env.NEXT_PUBLIC_JITSI_DOMAIN?.trim();
  const candidate = configured ? normalizeDomain(configured) : DEFAULT_JITSI_DOMAIN;
  const resolved = candidate || DEFAULT_JITSI_DOMAIN;

  if (BLOCKED_EMBED_DOMAINS.has(resolved)) {
    console.warn(
      `[media] ${resolved} blocks cross-origin iframe embed — using ${DEFAULT_JITSI_DOMAIN}`,
    );
    return DEFAULT_JITSI_DOMAIN;
  }

  return resolved;
}

export const jitsiMediaProvider: MeetingMediaProvider = {
  name: 'jitsi',

  getDefaultDomain() {
    return getJitsiDomain();
  },

  getExternalApiScriptUrl(domain: string) {
    return `https://${domain}/external_api.js`;
  },

  buildEmbedOptions(config: MeetingMediaSessionConfig): MeetingMediaEmbedOptions {
    const domain = getJitsiDomain();
    const allowDesktopSharing = config.allowDesktopSharing !== false;
    const startWithAudioMuted = config.startAudioMuted ?? false;
    const startWithVideoMuted = config.startVideoMuted ?? false;
    const startSilent = startWithAudioMuted && startWithVideoMuted;

    return {
      domain,
      roomName: config.roomName,
      displayName: config.displayName,
      userInfo: { displayName: config.displayName },
      configOverwrite: {
        startWithAudioMuted,
        startWithVideoMuted,
        startSilent,
        prejoinPageEnabled: false,
        prejoinConfig: { enabled: false },
        requireDisplayName: false,
        enableWelcomePage: false,
        enableClosePage: false,
        disableDeepLinking: true,
        disableInviteFunctions: true,
        disableRemoteMute: false,
        hideConferenceSubject: true,
        hideConferenceTimer: false,
        enableLobby: false,
        lobby: { autoKnock: false, enableChat: false },
        enableUserRolesBasedOnToken: false,
        enableFeaturesBasedOnToken: false,
        enableAuthentication: false,
        disableProfile: true,
        hideEmailInSettings: true,
        enableInsecureRoomNameWarning: false,
        membersOnly: false,
        disableThirdPartyRequests: true,
        disableModeratorIndicator: true,
        enableEmailInStats: false,
        enablePromotions: false,
        disablePolls: true,
        disableReactions: true,
        subject: 'Bold Meeting',
        defaultLogoUrl: 'data:',
        toolbarButtons: [],
        notifications: [],
        disableDesktopSharing: !allowDesktopSharing,
        disableStageFilmstrip: false,
        disableTileView: false,
        disableResponsiveTiles: false,
        disableFilmstrip: false,
        disableSelfView: false,
        disableSelfViewSettings: true,
        channelLastN: -1,
        enableLayerSuspension: true,
        enableTalkWhileMuted: false,
        enableNoisyMicDetection: true,
        p2p: { enabled: false },
        constraints: {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        },
        desktopSharingSources: ['screen', 'window', 'tab'],
      },
      interfaceConfigOverwrite: {
        APP_NAME: 'Bold',
        NATIVE_APP_NAME: 'Bold',
        PROVIDER_NAME: 'Bold',
        BRAND_WATERMARK_LINK: '',
        TOOLBAR_BUTTONS: [],
        TOOLBAR_ALWAYS_VISIBLE: false,
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        MOBILE_APP_PROMO: false,
        HIDE_INVITE_MORE_HEADER: true,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        AUTHENTICATION_ENABLE: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        FILM_STRIP_MAX_HEIGHT: 140,
        TILE_VIEW_MAX_COLUMNS: 5,
        VIDEO_LAYOUT_FIT: 'both',
        VERTICAL_FILMSTRIP: false,
        DEFAULT_BACKGROUND: '#0f172a',
        JITSI_WATERMARK_LINK: '',
        CLOSE_PAGE_GUEST_HINT: false,
        GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
        DISABLE_FOCUS_INDICATOR: false,
        DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
      },
    };
  },
};

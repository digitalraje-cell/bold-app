import { isDevEnvironment } from '@/lib/dev/is-dev-environment';
import {
  detectScreenShareCapability,
  type ScreenShareCapability,
} from '@/lib/media/screen-share-capability';
import {
  isAndroidUserAgent,
  isCoarsePointerMobileViewport,
  isIosDevice,
  isPwaStandalone,
  type RoomMode,
} from '@boldmeet/shared';

export type MoreMenuVisibility = {
  reactions: boolean;
  raiseHand: boolean;
  adminControls: {
    invite: boolean;
    switchRoomMode: boolean;
    muteAll: boolean;
    lockMeeting: boolean;
    waitingRoom: boolean;
    participantSharing: boolean;
    endMeeting: boolean;
  };
};

export type BrowserCapabilities = {
  userAgent: string;
  isMobile: boolean;
  isAndroid: boolean;
  isIos: boolean;
  isPwa: boolean;
  hasTouch: boolean;
  viewport: { width: number; height: number } | null;
};

export type MeetingControlsDiagnosticReport = {
  timestamp: string;
  userRole: string;
  isHost: boolean;
  isModerator: boolean;
  menu: {
    moreOpen: boolean;
    hasMoreItems: boolean;
    visibility: MoreMenuVisibility;
  };
  browser: BrowserCapabilities;
  screenShare: ScreenShareCapability;
  canShareScreenByRole: boolean;
};

const LOG_PREFIX = '[bold:meeting-controls]';

export function detectBrowserCapabilities(): BrowserCapabilities {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      isMobile: false,
      isAndroid: false,
      isIos: false,
      isPwa: false,
      hasTouch: false,
      viewport: null,
    };
  }

  const userAgent = navigator.userAgent;
  const isAndroid = isAndroidUserAgent(userAgent);
  const isIos = isIosDevice(userAgent);

  return {
    userAgent,
    isMobile: isAndroid || isIos || isCoarsePointerMobileViewport(),
    isAndroid,
    isIos,
    isPwa: isPwaStandalone(),
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
}

export function buildMoreMenuVisibility(input: {
  reactionsEnabled: boolean;
  raiseHandEnabled: boolean;
  onInvite?: () => void;
  onSwitchRoomMode?: (mode: RoomMode) => void;
  onMuteAll?: () => void;
  onToggleLock?: () => void;
  onToggleWaitingRoom?: () => void;
  onToggleParticipantScreenShare?: () => void;
  onEndMeeting?: () => void;
  isHost?: boolean;
  isModerator?: boolean;
}): MoreMenuVisibility {
  return {
    reactions: input.reactionsEnabled,
    raiseHand: input.raiseHandEnabled,
    adminControls: {
      invite: Boolean(input.onInvite),
      switchRoomMode: Boolean(input.onSwitchRoomMode),
      muteAll: Boolean(input.isModerator && input.onMuteAll),
      lockMeeting: Boolean(input.isHost && input.onToggleLock),
      waitingRoom: Boolean(input.isHost && input.onToggleWaitingRoom),
      participantSharing: Boolean(input.isHost && input.onToggleParticipantScreenShare),
      endMeeting: Boolean(input.isHost && input.onEndMeeting),
    },
  };
}

export function buildMeetingControlsDiagnosticReport(input: {
  userRole: string;
  isHost: boolean;
  isModerator: boolean;
  moreOpen: boolean;
  hasMoreItems: boolean;
  visibility: MoreMenuVisibility;
  canShareScreenByRole: boolean;
}): MeetingControlsDiagnosticReport {
  return {
    timestamp: new Date().toISOString(),
    userRole: input.userRole,
    isHost: input.isHost,
    isModerator: input.isModerator,
    menu: {
      moreOpen: input.moreOpen,
      hasMoreItems: input.hasMoreItems,
      visibility: input.visibility,
    },
    browser: detectBrowserCapabilities(),
    screenShare: detectScreenShareCapability(),
    canShareScreenByRole: input.canShareScreenByRole,
  };
}

export function logMeetingControlsEvent(
  event: string,
  payload: Record<string, unknown>,
): void {
  if (!isDevEnvironment()) return;
  console.info(`${LOG_PREFIX} ${event}`, payload);
}

export function publishMeetingControlsDiagnostics(
  report: MeetingControlsDiagnosticReport,
): void {
  if (!isDevEnvironment()) return;

  if (typeof window !== 'undefined') {
    (
      window as Window & { __BOLD_MEETING_DIAGNOSTICS__?: MeetingControlsDiagnosticReport }
    ).__BOLD_MEETING_DIAGNOSTICS__ = report;
  }

  console.info(`${LOG_PREFIX} diagnostic-report`, report);
}

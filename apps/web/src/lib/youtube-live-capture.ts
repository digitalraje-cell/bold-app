import { RoomMode } from '@boldmeet/shared';
import {
  logYouTubePipeline,
  logYouTubePipelineError,
} from '@/lib/youtube-live-pipeline-log';

/** Snapshot of Bold meeting stage state used to pick browser capture automatically. */
export type YouTubeLiveCaptureContext = {
  isScreenSharing: boolean;
  isPresenterLayout: boolean;
  roomMode: RoomMode;
  /** Jitsi mount node — region capture crops to this element when supported. */
  stageElement?: HTMLElement | null;
};

type CropTargetHandle = unknown;

type BrowserCaptureVideoTrack = MediaStreamTrack & {
  cropTo?: (target: CropTargetHandle) => Promise<void>;
};

type CropTargetStatic = {
  fromElement: (element: Element) => Promise<CropTargetHandle>;
};

type CaptureControllerInstance = {
  setFocusBehavior: (behavior: 'focus-captured-surface' | 'no-focus-change') => void;
};

async function applyRegionCapture(
  stream: MediaStream,
  stageElement: HTMLElement | null,
): Promise<void> {
  if (!stageElement) return;

  const CropTarget = (globalThis as { CropTarget?: CropTargetStatic }).CropTarget;
  const track = stream.getVideoTracks()[0] as BrowserCaptureVideoTrack | undefined;
  if (!CropTarget || !track?.cropTo) {
    logYouTubePipeline('STAGE-1-BROWSER', 'capture:region-crop:unsupported', {
      hasCropTarget: Boolean(CropTarget),
      hasCropTo: Boolean(track?.cropTo),
    });
    return;
  }

  try {
    const target = await CropTarget.fromElement(stageElement);
    await track.cropTo(target);
    logYouTubePipeline('STAGE-1-BROWSER', 'capture:region-crop:applied', {
      tagName: stageElement.tagName,
      width: stageElement.clientWidth,
      height: stageElement.clientHeight,
    });
  } catch (error) {
    logYouTubePipelineError('STAGE-1-BROWSER', 'capture:region-crop:failure', error);
  }
}

/**
 * Capture what attendees see in Bold:
 * - Prefer region capture on the Jitsi stage container (Chrome Region Capture API).
 * - Full-tab capture blanks cross-origin WebRTC iframes; cropping limits the damage
 *   and keeps the host's local stage readable.
 */
export async function captureMeetingStageForYouTube(
  context: YouTubeLiveCaptureContext,
): Promise<MediaStream> {
  logYouTubePipeline('STAGE-1-BROWSER', 'capture:meeting-stage:request', {
    isScreenSharing: context.isScreenSharing,
    isPresenterLayout: context.isPresenterLayout,
    roomMode: context.roomMode,
    hasStageElement: Boolean(context.stageElement),
    strategy: context.isScreenSharing || context.isPresenterLayout ? 'stage-with-share' : 'stage',
  });

  const CaptureControllerCtor = (globalThis as { CaptureController?: new () => CaptureControllerInstance })
    .CaptureController;
  const controller = CaptureControllerCtor ? new CaptureControllerCtor() : null;
  controller?.setFocusBehavior('no-focus-change');

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 30,
      },
      audio: {
        suppressLocalAudioPlayback: false,
      },
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'exclude',
      monitorTypeSurfaces: 'exclude',
      controller: controller ?? undefined,
    } as DisplayMediaStreamOptions & {
      preferCurrentTab?: boolean;
      selfBrowserSurface?: string;
      surfaceSwitching?: string;
      monitorTypeSurfaces?: string;
      controller?: CaptureControllerInstance;
    });

    await applyRegionCapture(stream, context.stageElement ?? null);

    const videoTrack = stream.getVideoTracks()[0];
    logYouTubePipeline('STAGE-1-BROWSER', 'capture:meeting-stage:success', {
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
      videoLabel: videoTrack?.label ?? null,
      displaySurface: videoTrack?.getSettings().displaySurface ?? null,
      regionCrop: Boolean(context.stageElement),
    });
    return stream;
  } catch (error) {
    logYouTubePipelineError('STAGE-1-BROWSER', 'capture:meeting-stage:failure', error, {
      isScreenSharing: context.isScreenSharing,
    });
    throw error;
  }
}

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
};

/**
 * Capture what attendees see in Bold:
 * - Meeting tab includes Jitsi stage (speaker, grid, webinar, pins, in-meeting screen share).
 * - When the host is presenting, the stage already shows the shared content.
 */
export async function captureMeetingStageForYouTube(
  context: YouTubeLiveCaptureContext,
): Promise<MediaStream> {
  logYouTubePipeline('STAGE-1-BROWSER', 'capture:meeting-stage:request', {
    isScreenSharing: context.isScreenSharing,
    isPresenterLayout: context.isPresenterLayout,
    roomMode: context.roomMode,
    strategy: context.isScreenSharing || context.isPresenterLayout ? 'stage-with-share' : 'stage',
  });

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 30,
        displaySurface: 'browser',
      } as MediaTrackConstraints,
      audio: true,
      preferCurrentTab: true,
    } as DisplayMediaStreamOptions & { preferCurrentTab?: boolean });

    const videoTrack = stream.getVideoTracks()[0];
    logYouTubePipeline('STAGE-1-BROWSER', 'capture:meeting-stage:success', {
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
      videoLabel: videoTrack?.label ?? null,
      displaySurface: videoTrack?.getSettings().displaySurface ?? null,
    });
    return stream;
  } catch (error) {
    logYouTubePipelineError('STAGE-1-BROWSER', 'capture:meeting-stage:failure', error, {
      isScreenSharing: context.isScreenSharing,
    });
    throw error;
  }
}

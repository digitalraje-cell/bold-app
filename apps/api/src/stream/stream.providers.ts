import { Injectable } from '@nestjs/common';
import {
  MeetingBroadcastProvider,
  MeetingBroadcastProviderType,
} from '@boldmeet/shared';

function trimUrl(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function buildOutputUrl(rtmpUrl: string, streamKey: string): string {
  const base = trimUrl(rtmpUrl);
  const key = streamKey.trim();
  if (!key) return base;
  if (base.endsWith(`/${key}`) || base.includes(`/${key}/`)) return base;
  return `${base}/${key}`;
}

@Injectable()
export class YoutubeRtmpBroadcastProvider implements MeetingBroadcastProvider {
  readonly type = MeetingBroadcastProviderType.YOUTUBE_RTMP;

  validateInput(input: { rtmpUrl: string; streamKey: string }): string | null {
    if (!input.streamKey?.trim()) return 'Stream key is required';
    const url = trimUrl(input.rtmpUrl).toLowerCase();
    if (!url.startsWith('rtmp://') && !url.startsWith('rtmps://')) {
      return 'RTMP URL must start with rtmp:// or rtmps://';
    }
    if (!url.includes('youtube.com') && !url.includes('googlevideo.com')) {
      return 'Use a YouTube RTMP URL (e.g. rtmp://a.rtmp.youtube.com/live2)';
    }
    return null;
  }

  normalizeRtmpUrl(rtmpUrl: string): string {
    return trimUrl(rtmpUrl);
  }

  buildOutputUrl(rtmpUrl: string, streamKey: string): string {
    return buildOutputUrl(this.normalizeRtmpUrl(rtmpUrl), streamKey);
  }
}

@Injectable()
export class CustomRtmpBroadcastProvider implements MeetingBroadcastProvider {
  readonly type = MeetingBroadcastProviderType.CUSTOM_RTMP;

  validateInput(input: { rtmpUrl: string; streamKey: string }): string | null {
    if (!input.rtmpUrl?.trim()) return 'RTMP URL is required';
    if (!input.streamKey?.trim()) return 'Stream key is required';
    const url = trimUrl(input.rtmpUrl).toLowerCase();
    if (!url.startsWith('rtmp://') && !url.startsWith('rtmps://')) {
      return 'RTMP URL must start with rtmp:// or rtmps://';
    }
    return null;
  }

  normalizeRtmpUrl(rtmpUrl: string): string {
    return trimUrl(rtmpUrl);
  }

  buildOutputUrl(rtmpUrl: string, streamKey: string): string {
    return buildOutputUrl(this.normalizeRtmpUrl(rtmpUrl), streamKey);
  }
}

export class MeetingBroadcastProviderRegistry {
  private providers: Map<
    MeetingBroadcastProviderType,
    MeetingBroadcastProvider
  >;

  constructor(
    youtube: YoutubeRtmpBroadcastProvider,
    custom: CustomRtmpBroadcastProvider,
  ) {
    this.providers = new Map<
      MeetingBroadcastProviderType,
      MeetingBroadcastProvider
    >([
      [MeetingBroadcastProviderType.YOUTUBE_RTMP, youtube],
      [MeetingBroadcastProviderType.CUSTOM_RTMP, custom],
    ]);
  }

  get(type: MeetingBroadcastProviderType): MeetingBroadcastProvider | null {
    if (type === MeetingBroadcastProviderType.NONE) return null;
    return this.providers.get(type) ?? null;
  }
}

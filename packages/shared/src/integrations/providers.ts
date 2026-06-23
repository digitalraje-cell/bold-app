export type StreamingPlatform =
  | 'youtube'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'x'
  | 'twitch'
  | 'custom_rtmp';

export type StreamingProviderStatus = 'active' | 'coming_soon';

export interface StreamingProviderDefinition {
  id: StreamingPlatform;
  name: string;
  shortName: string;
  status: StreamingProviderStatus;
  roadmapDescription: string;
  connectable: boolean;
  sortOrder: number;
}

export const STREAMING_PROVIDERS: StreamingProviderDefinition[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    shortName: 'YouTube',
    status: 'coming_soon',
    roadmapDescription: 'Coming Soon – Available in Phase 2',
    connectable: false,
    sortOrder: 1,
  },
  {
    id: 'facebook',
    name: 'Facebook Live',
    shortName: 'Facebook',
    status: 'coming_soon',
    roadmapDescription:
      'Facebook integration — planned for Max.',
    connectable: false,
    sortOrder: 2,
  },
  {
    id: 'instagram',
    name: 'Instagram Live',
    shortName: 'Instagram',
    status: 'coming_soon',
    roadmapDescription:
      'Instagram integration — planned for Max.',
    connectable: false,
    sortOrder: 3,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Live',
    shortName: 'LinkedIn',
    status: 'coming_soon',
    roadmapDescription:
      'LinkedIn integration — planned for Max.',
    connectable: false,
    sortOrder: 4,
  },
  {
    id: 'custom_rtmp',
    name: 'Custom RTMP',
    shortName: 'RTMP',
    status: 'coming_soon',
    roadmapDescription:
      'Custom RTMP endpoints — planned for Max.',
    connectable: false,
    sortOrder: 5,
  },
  {
    id: 'twitch',
    name: 'Twitch',
    shortName: 'Twitch',
    status: 'coming_soon',
    roadmapDescription: 'Twitch integration — planned after core Max launch.',
    connectable: false,
    sortOrder: 6,
  },
  {
    id: 'x',
    name: 'X (Twitter) Live',
    shortName: 'X',
    status: 'coming_soon',
    roadmapDescription: 'X Live integration — on the long-term Max roadmap.',
    connectable: false,
    sortOrder: 7,
  },
];

export const COMING_SOON_STREAMING_PROVIDERS = STREAMING_PROVIDERS.filter(
  (p) => p.status === 'coming_soon',
);

export const MEETING_GO_LIVE_COMING_SOON_DESTINATIONS = STREAMING_PROVIDERS.filter(
  (p) => p.id !== 'youtube' && p.id !== 'twitch' && p.id !== 'x',
);

export function getStreamingProvider(id: StreamingPlatform): StreamingProviderDefinition | undefined {
  return STREAMING_PROVIDERS.find((p) => p.id === id);
}

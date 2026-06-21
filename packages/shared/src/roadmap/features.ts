export const ROADMAP_VOTABLE_FEATURES = [
  {
    key: 'webinar_mode',
    title: 'Webinar Mode',
    description: 'Large-audience events with panelists and stage controls.',
    proIncluded: true,
  },
  {
    key: 'recording_library',
    title: 'Meeting Recording Library',
    description: 'Browse and replay past meeting recordings in one place.',
    proIncluded: true,
  },
  {
    key: 'ai_meeting_summary',
    title: 'AI Meeting Summary',
    description: 'Automatic recap of decisions and action items after each meeting.',
    proIncluded: false,
  },
  {
    key: 'ai_meeting_transcript',
    title: 'AI Meeting Transcript',
    description: 'Searchable, speaker-labelled transcripts for compliance and follow-up.',
    proIncluded: false,
  },
  {
    key: 'custom_branding',
    title: 'Custom Branding',
    description: 'Your logo, colours, and branded meeting links.',
    proIncluded: false,
  },
  {
    key: 'meeting_analytics',
    title: 'Meeting Analytics',
    description: 'Attendance, engagement, and usage insights across your team.',
    proIncluded: true,
  },
] as const;

export type RoadmapFeatureKey = (typeof ROADMAP_VOTABLE_FEATURES)[number]['key'];

export const ROADMAP_AVAILABLE_NOW = [
  'Meetings',
  'Chat',
  'Screen Share',
  'Raise Hand',
  'Reactions',
] as const;

export const ROADMAP_COMING_SOON: { title: string; proIncluded: boolean }[] = [
  { title: 'Webinar Mode', proIncluded: true },
  { title: 'Meeting Recording Library', proIncluded: true },
  { title: 'AI Meeting Summary', proIncluded: false },
  { title: 'AI Meeting Transcript', proIncluded: false },
  { title: 'Custom Branding', proIncluded: false },
  { title: 'Meeting Analytics', proIncluded: true },
];

/** @deprecated use ROADMAP_COMING_SOON */
export const ROADMAP_Q3_2026 = [
  'YouTube Recording',
  'Meeting Recording Library',
  'Multiple Co-hosts',
  'Attendee Reports',
] as const;

/** @deprecated use ROADMAP_COMING_SOON */
export const ROADMAP_Q4_2026 = [
  'Webinar Mode',
  'AI Meeting Summary',
  'AI Meeting Transcript',
  'Meeting Analytics',
  'Custom Branding',
] as const;

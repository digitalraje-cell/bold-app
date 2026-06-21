export const ROADMAP_VOTABLE_FEATURES = [
  {
    key: 'webinar_mode',
    title: 'Webinar Mode',
    description: 'Large-audience events with panelists and stage controls.',
  },
  {
    key: 'ai_meeting_summary',
    title: 'AI Meeting Summary',
    description: 'Automatic recap of decisions and action items after each meeting.',
  },
  {
    key: 'ai_meeting_transcript',
    title: 'AI Meeting Transcript',
    description: 'Searchable, speaker-labelled transcripts for compliance and follow-up.',
  },
  {
    key: 'custom_branding',
    title: 'Custom Branding',
    description: 'Your logo, colours, and branded meeting links.',
  },
  {
    key: 'meeting_analytics',
    title: 'Meeting Analytics',
    description: 'Attendance, engagement, and usage insights across your team.',
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

export const ROADMAP_Q3_2026 = [
  'YouTube Recording',
  'Meeting Recording Library',
  'Multiple Co-hosts',
  'Attendee Reports',
] as const;

export const ROADMAP_Q4_2026 = [
  'Webinar Mode',
  'AI Meeting Summary',
  'AI Meeting Transcript',
  'Meeting Analytics',
  'Custom Branding',
] as const;

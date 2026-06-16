/** Product mode — do not hardcode "meeting-only" assumptions in room logic. */
export enum MeetingType {
  MEETING = 'MEETING',
  WEBINAR = 'WEBINAR',
  EVERGREEN = 'EVERGREEN',
}

/** Webinar-specific roles (future); map to ParticipantRole where needed. */
export enum WebinarParticipantRole {
  HOST = 'HOST',
  CO_HOST = 'CO_HOST',
  SPEAKER = 'SPEAKER',
  ATTENDEE = 'ATTENDEE',
}

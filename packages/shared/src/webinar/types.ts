/**
 * Evergreen webinar architecture types (implementation deferred).
 */

export enum WebinarType {
  LIVE = 'LIVE',
  EVERGREEN = 'EVERGREEN',
}

export enum WebinarStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  ARCHIVED = 'ARCHIVED',
}

export enum VideoSourceProvider {
  YOUTUBE = 'YOUTUBE',
  BOLD_VIDEO = 'BOLD_VIDEO',
}

export enum WebinarModeratorRole {
  MODERATOR = 'MODERATOR',
  CO_MODERATOR = 'CO_MODERATOR',
}

export interface WebinarScheduleSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  recurrenceRule?: string | null;
}

export interface WebinarModeratorAssignment {
  id: string;
  email: string;
  userId?: string | null;
  role: WebinarModeratorRole;
  assignedAt: string;
}

export interface WebinarConfig {
  id: string;
  hostId: string;
  title: string;
  description?: string | null;
  type: WebinarType;
  status: WebinarStatus;
  videoSourceProvider: VideoSourceProvider;
  videoSourceUrl?: string | null;
  attendeeLimit: number;
  schedules: WebinarScheduleSlot[];
  moderators: WebinarModeratorAssignment[];
}

/**
 * Future chat moderation modes (not implemented).
 */
export enum WebinarChatModerationMode {
  NONE = 'NONE',
  HUMAN = 'HUMAN',
  AI = 'AI',
  HYBRID = 'HYBRID',
}

export interface WebinarService {
  create(config: Partial<WebinarConfig>): Promise<WebinarConfig>;
  getById(id: string): Promise<WebinarConfig | null>;
  assignModerator(webinarId: string, email: string): Promise<WebinarModeratorAssignment>;
}

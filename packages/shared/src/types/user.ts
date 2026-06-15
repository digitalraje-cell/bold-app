import { UserRole } from '../index';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  createdAt: string;
}

export interface YouTubeAccountInfo {
  channelId: string;
  channelName: string;
  channelUrl?: string | null;
  liveStreamingEnabled: boolean;
  connectedAt: string;
}

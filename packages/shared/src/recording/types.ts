/**
 * Recording destination provider abstraction.
 * Today: YouTube. Future: Bold Video Platform, custom storage.
 */

export enum RecordingProviderType {
  YOUTUBE = 'YOUTUBE',
  BOLD_VIDEO = 'BOLD_VIDEO',
  STORAGE = 'STORAGE',
}

export enum RecordingSessionStatus {
  IDLE = 'IDLE',
  PREPARING = 'PREPARING',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  ERROR = 'ERROR',
}

export interface RecordingDestination {
  provider: RecordingProviderType;
  externalId?: string;
  watchUrl?: string;
  rtmpUrl?: string;
  streamKey?: string;
}

export interface StartRecordingInput {
  meetingId: string;
  userId: string;
  title: string;
  visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
}

export interface StartRecordingResult {
  success: boolean;
  destination?: RecordingDestination;
  error?: string;
}

export interface StopRecordingInput {
  sessionId: string;
  meetingId: string;
}

export interface StopRecordingResult {
  success: boolean;
  recordingUrl?: string;
  error?: string;
}

/**
 * Provider interface — implement per destination (YouTube, Bold Video, etc.)
 */
export interface RecordingProvider {
  readonly type: RecordingProviderType;
  isAvailable(userId: string): Promise<boolean>;
  startRecording(input: StartRecordingInput): Promise<StartRecordingResult>;
  stopRecording(input: StopRecordingInput): Promise<StopRecordingResult>;
  getStatus(sessionId: string): Promise<RecordingSessionStatus>;
}

export interface RecordingProviderRegistry {
  getProvider(type: RecordingProviderType): RecordingProvider | null;
  getAvailableProviders(userId: string): Promise<RecordingProviderType[]>;
}

import { Injectable } from '@nestjs/common';
import {
  RecordingProvider,
  RecordingProviderType,
  RecordingSessionStatus,
  StartRecordingInput,
  StartRecordingResult,
  StopRecordingInput,
  StopRecordingResult,
} from '@boldmeet/shared';

@Injectable()
export class YouTubeRecordingProvider implements RecordingProvider {
  readonly type = RecordingProviderType.YOUTUBE;

  async isAvailable(_userId: string): Promise<boolean> {
    return false;
  }

  async startRecording(_input: StartRecordingInput): Promise<StartRecordingResult> {
    return {
      success: false,
      error: 'YouTube recording not yet implemented. Architecture is ready.',
    };
  }

  async stopRecording(_input: StopRecordingInput): Promise<StopRecordingResult> {
    return { success: false, error: 'Not implemented' };
  }

  async getStatus(_sessionId: string): Promise<RecordingSessionStatus> {
    return RecordingSessionStatus.IDLE;
  }
}

@Injectable()
export class BoldVideoRecordingProvider implements RecordingProvider {
  readonly type = RecordingProviderType.BOLD_VIDEO;

  async isAvailable(_userId: string): Promise<boolean> {
    return false;
  }

  async startRecording(_input: StartRecordingInput): Promise<StartRecordingResult> {
    return {
      success: false,
      error: 'Bold Video Platform recording coming soon.',
    };
  }

  async stopRecording(_input: StopRecordingInput): Promise<StopRecordingResult> {
    return { success: false, error: 'Not implemented' };
  }

  async getStatus(_sessionId: string): Promise<RecordingSessionStatus> {
    return RecordingSessionStatus.IDLE;
  }
}

@Injectable()
export class StorageRecordingProvider implements RecordingProvider {
  readonly type = RecordingProviderType.STORAGE;

  async isAvailable(_userId: string): Promise<boolean> {
    return false;
  }

  async startRecording(_input: StartRecordingInput): Promise<StartRecordingResult> {
    return { success: false, error: 'Storage provider not yet implemented.' };
  }

  async stopRecording(_input: StopRecordingInput): Promise<StopRecordingResult> {
    return { success: false, error: 'Not implemented' };
  }

  async getStatus(_sessionId: string): Promise<RecordingSessionStatus> {
    return RecordingSessionStatus.IDLE;
  }
}

@Injectable()
export class RecordingProviderRegistry {
  private providers: Map<RecordingProviderType, RecordingProvider>;

  constructor(
    youtube: YouTubeRecordingProvider,
    boldVideo: BoldVideoRecordingProvider,
    storage: StorageRecordingProvider,
  ) {
    this.providers = new Map<RecordingProviderType, RecordingProvider>([
      [RecordingProviderType.YOUTUBE, youtube],
      [RecordingProviderType.BOLD_VIDEO, boldVideo],
      [RecordingProviderType.STORAGE, storage],
    ]);
  }

  getProvider(type: RecordingProviderType): RecordingProvider | null {
    return this.providers.get(type) ?? null;
  }

  async getAvailableProviders(userId: string): Promise<RecordingProviderType[]> {
    const available: RecordingProviderType[] = [];
    for (const [type, provider] of this.providers) {
      if (await provider.isAvailable(userId)) {
        available.push(type);
      }
    }
    return available;
  }
}

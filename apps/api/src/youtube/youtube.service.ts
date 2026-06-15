import { Injectable } from '@nestjs/common';

@Injectable()
export class YoutubeService {
  getConnectionStatus() {
    return {
      connected: false,
      message: 'YouTube integration coming soon. Architecture is prepared for user-owned channel streaming.',
    };
  }
}

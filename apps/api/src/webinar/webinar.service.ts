import { Injectable, NotImplementedException } from '@nestjs/common';
import { WebinarConfig, WebinarModeratorAssignment } from '@boldmeet/shared';

/**
 * Webinar service placeholder — architecture only.
 * Full evergreen webinar implementation deferred to a future phase.
 */
@Injectable()
export class WebinarService {
  async create(_config: Partial<WebinarConfig>): Promise<WebinarConfig> {
    throw new NotImplementedException('Webinar creation coming in a future release');
  }

  async getById(_id: string): Promise<WebinarConfig | null> {
    throw new NotImplementedException('Webinar retrieval coming in a future release');
  }

  async assignModerator(
    _webinarId: string,
    _email: string,
  ): Promise<WebinarModeratorAssignment> {
    throw new NotImplementedException('Moderator assignment coming in a future release');
  }
}

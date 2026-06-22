import { Injectable } from '@nestjs/common';
import { ConnectedAccountProvider } from '@prisma/client';
import { STREAMING_PROVIDERS, type StreamingPlatform } from '@boldmeet/shared';
import { ConnectedAccountService } from './connected-account.service';

const PROVIDER_MAP: Record<StreamingPlatform, ConnectedAccountProvider> = {
  youtube: ConnectedAccountProvider.YOUTUBE,
  facebook: ConnectedAccountProvider.FACEBOOK,
  instagram: ConnectedAccountProvider.INSTAGRAM,
  linkedin: ConnectedAccountProvider.LINKEDIN,
  x: ConnectedAccountProvider.X,
  twitch: ConnectedAccountProvider.TWITCH,
  custom_rtmp: ConnectedAccountProvider.CUSTOM_RTMP,
};

@Injectable()
export class IntegrationsService {
  constructor(private readonly connectedAccounts: ConnectedAccountService) {}

  async getIntegrationsOverview(userId: string) {
    const accounts = await this.connectedAccounts.listForUser(userId);

    const sections = STREAMING_PROVIDERS.map((provider) => {
      const prismaProvider = PROVIDER_MAP[provider.id];
      const connected = accounts
        .filter((a) => a.provider === prismaProvider)
        .map((a) => ({
          id: a.id,
          accountId: a.accountId,
          accountName: a.accountName,
          accountType: a.accountType,
          accountAvatar: a.accountAvatar,
          accountEmail: a.accountEmail,
          status: a.status,
          connectedAt: a.connectedAt.toISOString(),
          lastValidatedAt: a.lastValidatedAt?.toISOString() ?? null,
        }));

      return {
        provider: provider.id,
        name: provider.name,
        shortName: provider.shortName,
        status: provider.status,
        roadmapDescription: provider.roadmapDescription,
        connectable: provider.connectable,
        accounts: connected,
      };
    });

    return { sections };
  }
}

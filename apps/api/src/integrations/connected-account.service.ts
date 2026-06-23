import { Injectable } from '@nestjs/common';
import {
  ConnectedAccountProvider,
  ConnectedAccountStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface SyncYoutubeConnectedAccountInput {
  userId: string;
  youtubeAccountId: string;
  channelId: string;
  channelName: string;
  channelAvatar?: string | null;
  gmailAccount?: string | null;
  liveStreamingEnabled: boolean;
  channelUrl?: string | null;
}

@Injectable()
export class ConnectedAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async syncFromYoutubeAccount(input: SyncYoutubeConnectedAccountInput) {
    const status = input.liveStreamingEnabled
      ? ConnectedAccountStatus.ACTIVE
      : ConnectedAccountStatus.PENDING_ACTIVATION;

    return this.prisma.connectedAccount.upsert({
      where: {
        userId_provider_accountId: {
          userId: input.userId,
          provider: ConnectedAccountProvider.YOUTUBE,
          accountId: input.channelId,
        },
      },
      create: {
        userId: input.userId,
        provider: ConnectedAccountProvider.YOUTUBE,
        accountId: input.channelId,
        accountName: input.channelName,
        accountType: 'channel',
        accountAvatar: input.channelAvatar ?? null,
        accountEmail: input.gmailAccount ?? null,
        status,
        legacyYoutubeAccountId: input.youtubeAccountId,
        lastValidatedAt: new Date(),
        metadata: {
          channelUrl: input.channelUrl ?? null,
        },
      },
      update: {
        accountName: input.channelName,
        accountAvatar: input.channelAvatar ?? null,
        accountEmail: input.gmailAccount ?? null,
        status,
        legacyYoutubeAccountId: input.youtubeAccountId,
        lastValidatedAt: new Date(),
        metadata: {
          channelUrl: input.channelUrl ?? null,
        },
      },
    });
  }

  async removeByLegacyYoutubeAccountId(youtubeAccountId: string) {
    await this.prisma.connectedAccount.deleteMany({
      where: { legacyYoutubeAccountId: youtubeAccountId },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.connectedAccount.findMany({
      where: { userId, status: { not: ConnectedAccountStatus.DISCONNECTED } },
      orderBy: [{ provider: 'asc' }, { connectedAt: 'desc' }],
    });
  }
}

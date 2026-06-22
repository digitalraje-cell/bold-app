import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  buildYouTubeActivationUrl,
  canConnectYoutubeChannel,
  getYoutubePlanLimits,
  YOUTUBE_LIVE_LEARN_MORE_URL,
  type YouTubePrivacyStatus,
} from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../subscriptions/permissions.service';
import { ConnectedAccountService } from '../integrations/connected-account.service';
import { decryptText, encryptText } from '../common/crypto.util';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
];

export interface YouTubeLiveSessionCredentials {
  broadcastId: string;
  streamId: string;
  rtmpUrl: string;
  streamKey: string;
  watchUrl: string;
  title: string;
}

@Injectable()
export class YoutubeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly connectedAccounts: ConnectedAccountService,
  ) {}

  private getEnterpriseChannelLimit(): number | undefined {
    const raw = process.env.ENTERPRISE_MAX_YOUTUBE_CHANNELS?.trim();
    if (!raw) return undefined;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private async resolveLimits(userId: string) {
    const { plan } = await this.permissions.getUserPlanContext(userId);
    const enterpriseMax = this.getEnterpriseChannelLimit();
    const limits = getYoutubePlanLimits(plan, { enterpriseMaxChannels: enterpriseMax });
    const channelCount = await this.prisma.youTubeAccount.count({ where: { userId } });
    return {
      ...limits,
      channelCount,
      canAddChannel: canConnectYoutubeChannel(plan, channelCount, enterpriseMax),
    };
  }

  private isOAuthConfigured(): boolean {
    return Boolean(
      process.env.YOUTUBE_CLIENT_ID?.trim() &&
        process.env.YOUTUBE_CLIENT_SECRET?.trim() &&
        process.env.YOUTUBE_REDIRECT_URI?.trim(),
    );
  }

  private getOAuthClient() {
    if (!this.isOAuthConfigured()) {
      throw new ServiceUnavailableException(
        'YouTube OAuth is not configured. Add YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REDIRECT_URI.',
      );
    }
    return {
      clientId: process.env.YOUTUBE_CLIENT_ID!.trim(),
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET!.trim(),
      redirectUri: process.env.YOUTUBE_REDIRECT_URI!.trim(),
    };
  }

  private toChannelDto(account: {
    id: string;
    channelId: string;
    channelName: string;
    channelUrl: string | null;
    channelAvatar: string | null;
    gmailAccount: string | null;
    liveStreamingEnabled: boolean;
    eligibilityCheckedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const lastValidatedAt = account.eligibilityCheckedAt?.toISOString() ?? null;
    return {
      id: account.id,
      channelId: account.channelId,
      name: account.channelName,
      url: account.channelUrl,
      channelAvatar: account.channelAvatar,
      gmailAccount: account.gmailAccount,
      liveStreamingEnabled: account.liveStreamingEnabled,
      status: account.liveStreamingEnabled
        ? ('live_enabled' as const)
        : ('activation_required' as const),
      eligibilityCheckedAt: lastValidatedAt,
      lastValidatedAt,
      connectedAt: account.createdAt.toISOString(),
      activationUrl: buildYouTubeActivationUrl(account.channelId),
      learnMoreUrl: YOUTUBE_LIVE_LEARN_MORE_URL,
    };
  }

  async getConnectionStatus(userId: string, refresh = false) {
    const accounts = await this.prisma.youTubeAccount.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (refresh && accounts.length > 0) {
      await Promise.all(accounts.map((a) => this.refreshAccountEligibility(a.id, userId)));
    }

    const refreshed = await this.prisma.youTubeAccount.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const channelDtos = refreshed.map((a) => this.toChannelDto(a));
    const limits = await this.resolveLimits(userId);

    return {
      connected: channelDtos.length > 0,
      oauthConfigured: this.isOAuthConfigured(),
      accounts: channelDtos,
      limits,
      channel: channelDtos[0] ?? null,
      message: channelDtos.length
        ? `${channelDtos.length} YouTube channel${channelDtos.length === 1 ? '' : 's'} connected.`
        : this.isOAuthConfigured()
          ? 'Connect your YouTube channel to stream Bold meetings live.'
          : 'Add YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REDIRECT_URI to enable OAuth.',
    };
  }

  async getConnectUrl(userId: string, returnTo?: string) {
    const limits = await this.resolveLimits(userId);
    if (!limits.canAddChannel) {
      if (limits.maxChannels === 0) {
        throw new ForbiddenException(
          'Upgrade to Pro to connect a YouTube channel for live streaming.',
        );
      }
      throw new BadRequestException(
        limits.maxPlanComingSoon && limits.upgradePlanLabel
          ? `Your ${limits.tierLabel} plan allows ${limits.maxChannels} channel. Join the ${limits.upgradePlanLabel} waitlist for multiple channels.`
          : `Your ${limits.tierLabel} plan allows ${limits.maxChannels} channel(s). Upgrade to ${limits.upgradePlanLabel ?? 'a higher plan'} to connect more.`,
      );
    }

    const { clientId, redirectUri } = this.getOAuthClient();
    const state = Buffer.from(
      JSON.stringify({ userId, returnTo: returnTo?.trim() || null }),
    ).toString('base64url');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: YOUTUBE_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent select_account',
      state,
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      scopes: YOUTUBE_SCOPES,
    };
  }

  async handleOAuthCallback(code: string, userId: string) {
    const { clientId, clientSecret, redirectUri } = this.getOAuthClient();

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      throw new ServiceUnavailableException(
        `YouTube OAuth token exchange failed: ${body.slice(0, 200)}`,
      );
    }

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,status,contentDetails&mine=true',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );

    if (!channelRes.ok) {
      throw new ServiceUnavailableException('Could not load YouTube channel for this Google account.');
    }

    const channelData = (await channelRes.json()) as {
      items?: Array<{
        id: string;
        snippet?: {
          title?: string;
          customUrl?: string;
          thumbnails?: { default?: { url?: string } };
        };
        status?: { longUploadsStatus?: string };
      }>;
    };

    const channel = channelData.items?.[0];
    if (!channel?.id) {
      throw new ServiceUnavailableException('No YouTube channel found for this Google account.');
    }

    const existingAccount = await this.prisma.youTubeAccount.findUnique({
      where: { userId_channelId: { userId, channelId: channel.id } },
    });

    if (!existingAccount) {
      const limits = await this.resolveLimits(userId);
      if (!limits.canAddChannel) {
        throw new ForbiddenException(
          limits.maxChannels === 0
            ? 'Upgrade to Pro to connect a YouTube channel.'
            : `Channel limit reached (${limits.maxChannels}). Upgrade to connect more channels.`,
        );
      }
    }

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = userInfoRes.ok
      ? ((await userInfoRes.json()) as { email?: string })
      : null;
    const gmailAccount = userInfo?.email?.trim() ?? null;
    const channelAvatar = channel.snippet?.thumbnails?.default?.url ?? null;

    const refreshToken =
      tokens.refresh_token ??
      (existingAccount ? decryptText(existingAccount.refreshToken) : null);
    if (!refreshToken) {
      throw new ServiceUnavailableException(
        'Google did not return a refresh token. Revoke app access and reconnect with consent.',
      );
    }

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const channelUrl = channel.snippet?.customUrl
      ? `https://www.youtube.com/${channel.snippet.customUrl}`
      : `https://www.youtube.com/channel/${channel.id}`;

    const account = await this.prisma.youTubeAccount.upsert({
      where: { userId_channelId: { userId, channelId: channel.id } },
      create: {
        userId,
        channelId: channel.id,
        channelName: channel.snippet?.title ?? 'YouTube Channel',
        channelUrl,
        channelAvatar,
        gmailAccount,
        accessToken: encryptText(tokens.access_token),
        refreshToken: encryptText(refreshToken),
        tokenExpiresAt,
        liveStreamingEnabled: false,
      },
      update: {
        channelName: channel.snippet?.title ?? 'YouTube Channel',
        channelUrl,
        channelAvatar,
        gmailAccount,
        accessToken: encryptText(tokens.access_token),
        refreshToken: encryptText(refreshToken),
        tokenExpiresAt,
      },
    });

    await this.refreshAccountEligibility(account.id, userId);

    const refreshed = await this.prisma.youTubeAccount.findUnique({ where: { id: account.id } });
    if (refreshed) {
      await this.connectedAccounts.syncFromYoutubeAccount({
        userId,
        youtubeAccountId: refreshed.id,
        channelId: refreshed.channelId,
        channelName: refreshed.channelName,
        channelAvatar: refreshed.channelAvatar,
        gmailAccount: refreshed.gmailAccount,
        liveStreamingEnabled: refreshed.liveStreamingEnabled,
        channelUrl: refreshed.channelUrl,
      });
    }

    return this.getConnectionStatus(userId, false);
  }

  async disconnectAccount(userId: string, accountId: string) {
    const account = await this.assertAccountOwnership(userId, accountId);
    await this.connectedAccounts.removeByLegacyYoutubeAccountId(account.id);
    await this.prisma.youTubeAccount.delete({ where: { id: account.id } });
    return this.getConnectionStatus(userId, false);
  }

  /** @deprecated use disconnectAccount */
  async disconnect(userId: string) {
    await this.prisma.youTubeAccount.deleteMany({ where: { userId } });
    return { connected: false, message: 'All YouTube channels disconnected.' };
  }

  async refreshAccountEligibility(accountId: string, userId: string) {
    const account = await this.assertAccountOwnership(userId, accountId);
    const accessToken = await this.getValidAccessToken(account.id);
    const enabled = await this.checkLiveStreamingEligibility(accessToken, account.channelId);

    const updated = await this.prisma.youTubeAccount.update({
      where: { id: account.id },
      data: {
        liveStreamingEnabled: enabled,
        eligibilityCheckedAt: new Date(),
      },
    });

    await this.connectedAccounts.syncFromYoutubeAccount({
      userId,
      youtubeAccountId: updated.id,
      channelId: updated.channelId,
      channelName: updated.channelName,
      channelAvatar: updated.channelAvatar,
      gmailAccount: updated.gmailAccount,
      liveStreamingEnabled: updated.liveStreamingEnabled,
      channelUrl: updated.channelUrl,
    });

    return updated;
  }

  async assertAccountOwnership(userId: string, accountId: string) {
    const account = await this.prisma.youTubeAccount.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new NotFoundException('YouTube channel not found for this user.');
    }
    return account;
  }

  async requireLiveEnabledAccount(userId: string, accountId: string) {
    const account = await this.assertAccountOwnership(userId, accountId);
    if (!account.liveStreamingEnabled) {
      await this.refreshAccountEligibility(account.id, userId);
      const refreshed = await this.prisma.youTubeAccount.findUnique({ where: { id: account.id } });
      if (!refreshed?.liveStreamingEnabled) {
        throw new BadRequestException(
          'This YouTube channel is not enabled for live streaming yet. Enable it in YouTube Studio and try again.',
        );
      }
      return refreshed;
    }
    return account;
  }

  async getValidAccessToken(accountId: string): Promise<string> {
    const account = await this.prisma.youTubeAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      throw new BadRequestException('YouTube channel connection not found.');
    }

    if (account.tokenExpiresAt.getTime() > Date.now() + 60_000) {
      const accessToken = decryptText(account.accessToken);
      if (!accessToken) {
        throw new ServiceUnavailableException('Stored YouTube token is invalid. Reconnect your account.');
      }
      return accessToken;
    }

    const { clientId, clientSecret } = this.getOAuthClient();
    const refreshToken = decryptText(account.refreshToken);
    if (!refreshToken) {
      throw new ServiceUnavailableException('Stored YouTube refresh token is invalid. Reconnect your account.');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenRes.ok) {
      throw new ServiceUnavailableException(
        'YouTube authorization expired. Reconnect your YouTube channel in Bold.',
      );
    }

    const tokens = (await tokenRes.json()) as { access_token: string; expires_in: number };
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await this.prisma.youTubeAccount.update({
      where: { id: accountId },
      data: {
        accessToken: encryptText(tokens.access_token),
        tokenExpiresAt,
      },
    });

    return tokens.access_token;
  }

  private async checkLiveStreamingEligibility(
    accessToken: string,
    channelId: string,
  ): Promise<boolean> {
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=status&id=${encodeURIComponent(channelId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (channelRes.ok) {
      const data = (await channelRes.json()) as {
        items?: Array<{ status?: { longUploadsStatus?: string } }>;
      };
      const uploads = data.items?.[0]?.status?.longUploadsStatus;
      if (uploads === 'allowed') return true;
    }

    const probeRes = await fetch(
      'https://www.googleapis.com/youtube/v3/liveStreams?part=snippet&mine=true&maxResults=1',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (probeRes.ok) return true;

    const body = await probeRes.text();
    if (
      body.includes('liveStreamingNotEnabled') ||
      body.includes('not enabled for live streaming') ||
      body.includes('Live streaming is not enabled')
    ) {
      return false;
    }

    return false;
  }

  async createLiveSession(
    accountId: string,
    userId: string,
    input: { title: string; description: string; privacyStatus: YouTubePrivacyStatus },
  ): Promise<YouTubeLiveSessionCredentials> {
    await this.requireLiveEnabledAccount(userId, accountId);
    const accessToken = await this.getValidAccessToken(accountId);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const streamRes = await fetch(
      'https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn,status',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          snippet: { title: input.title },
          cdn: {
            frameRate: '30fps',
            ingestionType: 'rtmp',
            resolution: '720p',
          },
        }),
      },
    );

    if (!streamRes.ok) {
      const body = await streamRes.text();
      if (body.includes('liveStreamingNotEnabled') || body.includes('not enabled for live')) {
        await this.prisma.youTubeAccount.update({
          where: { id: accountId },
          data: { liveStreamingEnabled: false, eligibilityCheckedAt: new Date() },
        });
        throw new BadRequestException(
          'YouTube live streaming is not enabled for this channel. Enable it in YouTube Studio.',
        );
      }
      throw new ServiceUnavailableException(
        `Could not create YouTube stream: ${body.slice(0, 300)}`,
      );
    }

    const streamData = (await streamRes.json()) as {
      id: string;
      cdn?: { ingestionInfo?: { ingestionAddress?: string; streamName?: string } };
    };

    const ingestionAddress = streamData.cdn?.ingestionInfo?.ingestionAddress;
    const streamName = streamData.cdn?.ingestionInfo?.streamName;
    if (!streamData.id || !ingestionAddress || !streamName) {
      throw new ServiceUnavailableException('YouTube did not return RTMP ingest credentials.');
    }

    const broadcastRes = await fetch(
      'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          snippet: {
            title: input.title,
            description: input.description,
            scheduledStartTime: new Date().toISOString(),
          },
          status: {
            privacyStatus: input.privacyStatus,
            selfDeclaredMadeForKids: false,
          },
          contentDetails: {
            enableAutoStart: false,
            enableAutoStop: true,
            enableDvr: true,
            recordFromStart: true,
          },
        }),
      },
    );

    if (!broadcastRes.ok) {
      const body = await broadcastRes.text();
      throw new ServiceUnavailableException(
        `Could not create YouTube broadcast: ${body.slice(0, 300)}`,
      );
    }

    const broadcastData = (await broadcastRes.json()) as { id: string };
    if (!broadcastData.id) {
      throw new ServiceUnavailableException('YouTube did not return a broadcast ID.');
    }

    const bindRes = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${encodeURIComponent(broadcastData.id)}&part=id,contentDetails&streamId=${encodeURIComponent(streamData.id)}`,
      { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!bindRes.ok) {
      const body = await bindRes.text();
      throw new ServiceUnavailableException(
        `Could not bind YouTube broadcast: ${body.slice(0, 300)}`,
      );
    }

    const watchUrl = await this.resolveBroadcastWatchUrl(accessToken, broadcastData.id);

    return {
      broadcastId: broadcastData.id,
      streamId: streamData.id,
      rtmpUrl: ingestionAddress,
      streamKey: streamName,
      watchUrl,
      title: input.title,
    };
  }

  async transitionBroadcastToLive(accountId: string, broadcastId: string): Promise<void> {
    const accessToken = await this.getValidAccessToken(accountId);
    await this.transitionBroadcast(accessToken, broadcastId, 'testing');
    await this.transitionBroadcast(accessToken, broadcastId, 'live');
  }

  async endBroadcast(accountId: string, broadcastId: string): Promise<void> {
    const accessToken = await this.getValidAccessToken(accountId);
    try {
      await this.transitionBroadcast(accessToken, broadcastId, 'complete');
    } catch {
      // Broadcast may already be complete
    }
  }

  async getLiveViewerCount(accountId: string, broadcastId: string): Promise<number | null> {
    try {
      const accessToken = await this.getValidAccessToken(accountId);
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${encodeURIComponent(broadcastId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        items?: Array<{ liveStreamingDetails?: { concurrentViewers?: string } }>;
      };
      const viewers = data.items?.[0]?.liveStreamingDetails?.concurrentViewers;
      return viewers ? Number.parseInt(viewers, 10) : null;
    } catch {
      return null;
    }
  }

  private async resolveBroadcastWatchUrl(
    accessToken: string,
    broadcastId: string,
  ): Promise<string> {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&id=${encodeURIComponent(broadcastId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.ok) {
      const data = (await res.json()) as {
        items?: Array<{ id: string }>;
      };
      if (data.items?.[0]?.id) {
        return `https://www.youtube.com/watch?v=${data.items[0].id}`;
      }
    }
    return `https://www.youtube.com/watch?v=${broadcastId}`;
  }

  private async transitionBroadcast(
    accessToken: string,
    broadcastId: string,
    status: 'testing' | 'live' | 'complete',
  ): Promise<void> {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=${status}&id=${encodeURIComponent(broadcastId)}&part=status`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new ServiceUnavailableException(
        `YouTube broadcast transition (${status}) failed: ${body.slice(0, 300)}`,
      );
    }
  }

  getArchitecture() {
    return {
      version: '3.0',
      status: 'active',
      hostCentric: true,
      multiAccount: true,
      oauth: {
        provider: 'google',
        scopes: YOUTUBE_SCOPES,
        connectEndpoint: 'GET /youtube/connect',
        callbackEndpoint: 'GET /youtube/callback',
        tokenStorage: 'youtube_accounts per user+channel (encrypted)',
      },
      liveStream: {
        eligibilityCheck: 'YouTube Data API channels + liveStreams probe',
        activationUrl: 'studio.youtube.com/channel/{channelId}/livestreaming',
      },
    };
  }
}

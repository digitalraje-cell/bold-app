import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
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

export type YoutubeTransitionResult =
  | 'live'
  | 'already-live'
  | 'auto-started'
  | 'timed-out';

export type YoutubeTransitionContext = {
  meetingId?: string;
  maxWaitMs?: number;
  pollIntervalMs?: number;
  /** When false (default), timeout logs and returns without throwing. */
  throwOnTimeout?: boolean;
};

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  /** One in-flight transition workflow per YouTube broadcastId. */
  private readonly transitionWorkflowByBroadcast = new Map<
    string,
    Promise<YoutubeTransitionResult>
  >();

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
    const limits = getYoutubePlanLimits(plan, {
      enterpriseMaxChannels: enterpriseMax,
    });
    const channelCount = await this.prisma.youTubeAccount.count({
      where: { userId },
    });
    return {
      ...limits,
      channelCount,
      canAddChannel: canConnectYoutubeChannel(
        plan,
        channelCount,
        enterpriseMax,
      ),
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
      await Promise.all(
        accounts.map((a) => this.refreshAccountEligibility(a.id, userId)),
      );
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
      throw new ServiceUnavailableException(
        'Could not load YouTube channel for this Google account.',
      );
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
      throw new ServiceUnavailableException(
        'No YouTube channel found for this Google account.',
      );
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

    const userInfoRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      },
    );
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

    const refreshed = await this.prisma.youTubeAccount.findUnique({
      where: { id: account.id },
    });
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
    const enabled = await this.checkLiveStreamingEligibility(
      accessToken,
      account.channelId,
    );

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
      const refreshed = await this.prisma.youTubeAccount.findUnique({
        where: { id: account.id },
      });
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
    const account = await this.prisma.youTubeAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new BadRequestException('YouTube channel connection not found.');
    }

    if (account.tokenExpiresAt.getTime() > Date.now() + 60_000) {
      const accessToken = decryptText(account.accessToken);
      if (!accessToken) {
        throw new ServiceUnavailableException(
          'Stored YouTube token is invalid. Reconnect your account.',
        );
      }
      return accessToken;
    }

    const { clientId, clientSecret } = this.getOAuthClient();
    const refreshToken = decryptText(account.refreshToken);
    if (!refreshToken) {
      throw new ServiceUnavailableException(
        'Stored YouTube refresh token is invalid. Reconnect your account.',
      );
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

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      expires_in: number;
    };
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
    input: {
      title: string;
      description: string;
      privacyStatus: YouTubePrivacyStatus;
    },
  ): Promise<YouTubeLiveSessionCredentials> {
    await this.requireLiveEnabledAccount(userId, accountId);
    const accessToken = await this.getValidAccessToken(accountId);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    this.logger.log(
      `[youtube-live] createLiveSession:start accountId=${accountId} title=${JSON.stringify(input.title)}`,
    );

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

    const streamRawBody = await streamRes.text();
    if (!streamRes.ok) {
      this.logger.error(
        `[youtube-live] createStream:failed status=${streamRes.status} body=${streamRawBody.slice(0, 500)}`,
      );
      if (
        streamRawBody.includes('liveStreamingNotEnabled') ||
        streamRawBody.includes('not enabled for live')
      ) {
        await this.prisma.youTubeAccount.update({
          where: { id: accountId },
          data: {
            liveStreamingEnabled: false,
            eligibilityCheckedAt: new Date(),
          },
        });
        throw new BadRequestException(
          'YouTube live streaming is not enabled for this channel. Enable it in YouTube Studio.',
        );
      }
      throw new ServiceUnavailableException(
        `Could not create YouTube stream: ${streamRawBody.slice(0, 300)}`,
      );
    }

    const streamData = JSON.parse(streamRawBody) as {
      id: string;
      status?: { streamStatus?: string; healthStatus?: string };
      cdn?: {
        ingestionInfo?: { ingestionAddress?: string; streamName?: string };
      };
    };

    const ingestionAddress = streamData.cdn?.ingestionInfo?.ingestionAddress;
    const streamName = streamData.cdn?.ingestionInfo?.streamName;
    if (!streamData.id || !ingestionAddress || !streamName) {
      throw new ServiceUnavailableException(
        'YouTube did not return RTMP ingest credentials.',
      );
    }

    this.logger.log(
      `[youtube-live] createStream:success ${JSON.stringify({
        streamId: streamData.id,
        streamStatus: streamData.status?.streamStatus ?? null,
        healthStatus: streamData.status?.healthStatus ?? null,
      })}`,
    );

    const broadcastBody = {
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
        enableAutoStart: true,
        enableAutoStop: true,
        enableDvr: true,
        recordFromStart: true,
      },
    };

    this.logger.log(
      `[youtube-live] createBroadcast:request ${JSON.stringify({
        enableAutoStart: broadcastBody.contentDetails.enableAutoStart,
        enableAutoStop: broadcastBody.contentDetails.enableAutoStop,
        privacyStatus: broadcastBody.status.privacyStatus,
        scheduledStartTime: broadcastBody.snippet.scheduledStartTime,
      })}`,
    );

    const broadcastRes = await fetch(
      'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(broadcastBody),
      },
    );

    const broadcastRawBody = await broadcastRes.text();
    if (!broadcastRes.ok) {
      this.logger.error(
        `[youtube-live] createBroadcast:failed status=${broadcastRes.status} body=${broadcastRawBody.slice(0, 500)}`,
      );
      throw new ServiceUnavailableException(
        `Could not create YouTube broadcast: ${broadcastRawBody.slice(0, 300)}`,
      );
    }

    const broadcastData = JSON.parse(broadcastRawBody) as {
      id: string;
      status?: { lifeCycleStatus?: string; privacyStatus?: string };
      contentDetails?: {
        enableAutoStart?: boolean;
        enableAutoStop?: boolean;
      };
      snippet?: { scheduledStartTime?: string; actualStartTime?: string };
    };
    if (!broadcastData.id) {
      throw new ServiceUnavailableException(
        'YouTube did not return a broadcast ID.',
      );
    }

    this.logger.log(
      `[youtube-live] createBroadcast:success ${JSON.stringify({
        broadcastId: broadcastData.id,
        lifeCycleStatus: broadcastData.status?.lifeCycleStatus ?? null,
        enableAutoStart: broadcastData.contentDetails?.enableAutoStart ?? null,
        enableAutoStop: broadcastData.contentDetails?.enableAutoStop ?? null,
        scheduledStartTime: broadcastData.snippet?.scheduledStartTime ?? null,
        actualStartTime: broadcastData.snippet?.actualStartTime ?? null,
      })}`,
    );

    const bindUrl = `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${encodeURIComponent(broadcastData.id)}&part=snippet,status,contentDetails&streamId=${encodeURIComponent(streamData.id)}`;
    this.logger.log(
      `[youtube-live] bindBroadcast:request broadcastId=${broadcastData.id} streamId=${streamData.id}`,
    );

    const bindRes = await fetch(bindUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const bindRawBody = await bindRes.text();
    if (!bindRes.ok) {
      this.logger.error(
        `[youtube-live] bindBroadcast:failed status=${bindRes.status} body=${bindRawBody.slice(0, 500)}`,
      );
      throw new ServiceUnavailableException(
        `Could not bind YouTube broadcast: ${bindRawBody.slice(0, 300)}`,
      );
    }

    let bindData: {
      id?: string;
      status?: { lifeCycleStatus?: string };
      contentDetails?: { boundStreamId?: string };
    } = {};
    try {
      bindData = JSON.parse(bindRawBody) as typeof bindData;
    } catch {
      bindData = {};
    }

    this.logger.log(
      `[youtube-live] bindBroadcast:success ${JSON.stringify({
        broadcastId: bindData.id ?? broadcastData.id,
        lifeCycleStatus: bindData.status?.lifeCycleStatus ?? null,
        boundStreamId: bindData.contentDetails?.boundStreamId ?? streamData.id,
        responseBody: bindRawBody.slice(0, 500),
      })}`,
    );

    await this.logBroadcastLifecycleSnapshot(
      accessToken,
      broadcastData.id,
      streamData.id,
      'post-bind',
    );

    const watchUrl = await this.resolveBroadcastWatchUrl(
      accessToken,
      broadcastData.id,
    );

    this.logger.log(
      `[youtube-live] createLiveSession:ready broadcastId=${broadcastData.id} streamId=${streamData.id} watchUrl=${watchUrl}`,
    );

    return {
      broadcastId: broadcastData.id,
      streamId: streamData.id,
      rtmpUrl: ingestionAddress,
      streamKey: streamName,
      watchUrl,
      title: input.title,
    };
  }

  async transitionBroadcastToLive(
    accountId: string,
    broadcastId: string,
    context?: YoutubeTransitionContext,
  ): Promise<YoutubeTransitionResult> {
    return this.transitionBroadcastToLiveWhenReady(
      accountId,
      broadcastId,
      context,
    );
  }

  /**
   * Idempotent: concurrent calls for the same broadcastId share one workflow.
   * Waits for YouTube RTMP ingest (streamStatus=active) before manual transition.
   */
  async transitionBroadcastToLiveWhenReady(
    accountId: string,
    broadcastId: string,
    context?: YoutubeTransitionContext,
  ): Promise<YoutubeTransitionResult> {
    const existing = this.transitionWorkflowByBroadcast.get(broadcastId);
    if (existing) {
      this.logger.log(
        `[youtube-live] transitionBroadcastToLiveWhenReady:dedupe ${JSON.stringify(
          {
            meetingId: context?.meetingId ?? null,
            broadcastId,
            note: 'transition-workflow-already-running',
          },
        )}`,
      );
      return existing;
    }

    const workflow = this.runTransitionBroadcastWorkflow(
      accountId,
      broadcastId,
      context,
    ).finally(() => {
      this.transitionWorkflowByBroadcast.delete(broadcastId);
    });

    this.transitionWorkflowByBroadcast.set(broadcastId, workflow);
    return workflow;
  }

  private async runTransitionBroadcastWorkflow(
    accountId: string,
    broadcastId: string,
    context?: YoutubeTransitionContext,
  ): Promise<YoutubeTransitionResult> {
    const maxWaitMs = context?.maxWaitMs ?? 90_000;
    const pollIntervalMs = context?.pollIntervalMs ?? 2_000;
    const throwOnTimeout = context?.throwOnTimeout ?? false;

    const accessToken = await this.getValidAccessToken(accountId);
    const boundStreamId = await this.resolveBoundStreamId(
      accessToken,
      broadcastId,
    );
    if (!boundStreamId) {
      this.logger.error(
        `[youtube-live] transitionBroadcastToLiveWhenReady:no-bound-stream ${JSON.stringify(
          {
            meetingId: context?.meetingId ?? null,
            broadcastId,
          },
        )}`,
      );
      throw new ServiceUnavailableException(
        'YouTube broadcast has no bound live stream.',
      );
    }

    this.logLifecycleContext('transitionBroadcastToLiveWhenReady:start', {
      meetingId: context?.meetingId ?? null,
      broadcastId,
      streamId: boundStreamId,
      maxWaitMs,
    });

    await this.logLiveStreamsList(accessToken, boundStreamId, 'pre-transition');
    await this.logBroadcastLifecycleSnapshot(
      accessToken,
      broadcastId,
      boundStreamId,
      'pre-transition',
      context?.meetingId,
    );

    const enableAutoStart = await this.getBroadcastEnableAutoStart(
      accessToken,
      broadcastId,
    );

    const deadline = Date.now() + maxWaitMs;
    let attempt = 0;
    while (Date.now() < deadline) {
      attempt += 1;
      const streamStatus = await this.fetchYouTubeStreamStatus(
        accessToken,
        boundStreamId,
      );
      const broadcastStatus = await this.fetchBroadcastLifecycle(
        accessToken,
        broadcastId,
      );

      this.logLifecycleContext('transitionBroadcastToLiveWhenReady:poll', {
        meetingId: context?.meetingId ?? null,
        broadcastId,
        streamId: boundStreamId,
        streamStatus: streamStatus.streamStatus,
        lifecycleStatus: broadcastStatus.lifeCycleStatus,
        actualStartTime: broadcastStatus.actualStartTime,
        attempt,
        enableAutoStart,
      });

      if (broadcastStatus.lifeCycleStatus === 'live') {
        this.logLifecycleContext(
          'transitionBroadcastToLiveWhenReady:already-live',
          {
            meetingId: context?.meetingId ?? null,
            broadcastId,
            streamId: boundStreamId,
            streamStatus: streamStatus.streamStatus,
            lifecycleStatus: broadcastStatus.lifeCycleStatus,
            actualStartTime: broadcastStatus.actualStartTime,
            enableAutoStart,
          },
        );
        return 'already-live';
      }

      if (
        enableAutoStart &&
        (broadcastStatus.lifeCycleStatus === 'testing' ||
          broadcastStatus.lifeCycleStatus === 'live')
      ) {
        this.logLifecycleContext(
          'transitionBroadcastToLiveWhenReady:auto-started',
          {
            meetingId: context?.meetingId ?? null,
            broadcastId,
            streamId: boundStreamId,
            streamStatus: streamStatus.streamStatus,
            lifecycleStatus: broadcastStatus.lifeCycleStatus,
            actualStartTime: broadcastStatus.actualStartTime,
          },
        );
        return 'auto-started';
      }

      if (streamStatus.streamStatus === 'active') {
        const refreshed = await this.fetchBroadcastLifecycle(
          accessToken,
          broadcastId,
        );
        if (
          refreshed.lifeCycleStatus === 'live' ||
          refreshed.lifeCycleStatus === 'testing'
        ) {
          this.logLifecycleContext(
            'transitionBroadcastToLiveWhenReady:skip-manual-transition',
            {
              meetingId: context?.meetingId ?? null,
              broadcastId,
              streamId: boundStreamId,
              streamStatus: streamStatus.streamStatus,
              lifecycleStatus: refreshed.lifeCycleStatus,
              actualStartTime: refreshed.actualStartTime,
              note: 'youtube-already-advanced-before-manual-transition',
            },
          );
          return refreshed.lifeCycleStatus === 'live'
            ? 'already-live'
            : 'auto-started';
        }

        this.logLifecycleContext(
          'transitionBroadcastToLiveWhenReady:stream-active',
          {
            meetingId: context?.meetingId ?? null,
            broadcastId,
            streamId: boundStreamId,
            streamStatus: streamStatus.streamStatus,
            lifecycleStatus: refreshed.lifeCycleStatus,
            actualStartTime: refreshed.actualStartTime,
          },
        );
        await this.logLiveStreamsList(
          accessToken,
          boundStreamId,
          'stream-active',
        );
        await this.transitionBroadcast(accessToken, broadcastId, 'testing');
        await this.transitionBroadcast(accessToken, broadcastId, 'live');
        await this.logBroadcastLifecycleSnapshot(
          accessToken,
          broadcastId,
          boundStreamId,
          'post-transition',
          context?.meetingId,
        );
        this.logLifecycleContext(
          'transitionBroadcastToLiveWhenReady:complete',
          {
            meetingId: context?.meetingId ?? null,
            broadcastId,
            streamId: boundStreamId,
            lifecycleStatus: 'live',
          },
        );
        return 'live';
      }

      await this.sleep(pollIntervalMs);
    }

    const streamStatus = await this.fetchYouTubeStreamStatus(
      accessToken,
      boundStreamId,
    );
    const broadcastStatus = await this.fetchBroadcastLifecycle(
      accessToken,
      broadcastId,
    );
    await this.logLiveStreamsList(accessToken, boundStreamId, 'wait-timeout');
    await this.logBroadcastLifecycleSnapshot(
      accessToken,
      broadcastId,
      boundStreamId,
      'wait-timeout',
      context?.meetingId,
    );
    this.logLifecycleContext('transitionBroadcastToLiveWhenReady:timeout', {
      meetingId: context?.meetingId ?? null,
      broadcastId,
      streamId: boundStreamId,
      streamStatus: streamStatus.streamStatus,
      lifecycleStatus: broadcastStatus.lifeCycleStatus,
      actualStartTime: broadcastStatus.actualStartTime,
      maxWaitMs,
      note: 'meeting-continues-relay-may-still-be-ingesting',
    });

    if (throwOnTimeout) {
      throw new ServiceUnavailableException(
        'YouTube did not receive stream data in time. Ensure screen sharing started and try again.',
      );
    }
    return 'timed-out';
  }

  private logLifecycleContext(
    phase: string,
    fields: {
      meetingId?: string | null;
      broadcastId: string;
      streamId: string;
      streamStatus?: string | null;
      lifecycleStatus?: string | null;
      actualStartTime?: string | null;
      [key: string]: unknown;
    },
  ): void {
    this.logger.log(`[youtube-live] ${phase} ${JSON.stringify(fields)}`);
  }

  private async fetchYouTubeStreamStatus(
    accessToken: string,
    youtubeStreamId: string,
  ): Promise<{ streamStatus: string | null; healthStatus: string | null }> {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/liveStreams?part=status&id=${encodeURIComponent(youtubeStreamId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const body = await res.text();
    if (!res.ok) {
      this.logger.warn(
        `[youtube-live] liveStreams.list:failed youtubeStreamId=${youtubeStreamId} httpStatus=${res.status} body=${body.slice(0, 500)}`,
      );
      return { streamStatus: null, healthStatus: null };
    }
    try {
      const parsed = JSON.parse(body) as {
        items?: Array<{
          status?: { streamStatus?: string; healthStatus?: string };
        }>;
      };
      const streamStatus = parsed.items?.[0]?.status?.streamStatus ?? null;
      const healthStatus = parsed.items?.[0]?.status?.healthStatus ?? null;
      this.logger.log(
        `[youtube-live-pipeline] youtube:liveStreams.list youtubeStreamId=${youtubeStreamId} streamStatus=${streamStatus} healthStatus=${healthStatus}`,
      );
      return { streamStatus, healthStatus };
    } catch {
      return { streamStatus: null, healthStatus: null };
    }
  }

  private async fetchBroadcastLifecycle(
    accessToken: string,
    broadcastId: string,
  ): Promise<{
    lifeCycleStatus: string | null;
    actualStartTime: string | null;
  }> {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&id=${encodeURIComponent(broadcastId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) {
      return { lifeCycleStatus: null, actualStartTime: null };
    }
    const data = (await res.json()) as {
      items?: Array<{
        status?: { lifeCycleStatus?: string };
        snippet?: { actualStartTime?: string };
      }>;
    };
    const item = data.items?.[0];
    return {
      lifeCycleStatus: item?.status?.lifeCycleStatus ?? null,
      actualStartTime: item?.snippet?.actualStartTime ?? null,
    };
  }

  private async fetchBroadcastLifeCycleStatus(
    accessToken: string,
    broadcastId: string,
  ): Promise<string | null> {
    const details = await this.fetchBroadcastLifecycle(
      accessToken,
      broadcastId,
    );
    return details.lifeCycleStatus;
  }

  private async getBroadcastEnableAutoStart(
    accessToken: string,
    broadcastId: string,
  ): Promise<boolean> {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=contentDetails&id=${encodeURIComponent(broadcastId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as {
      items?: Array<{ contentDetails?: { enableAutoStart?: boolean } }>;
    };
    return Boolean(data.items?.[0]?.contentDetails?.enableAutoStart);
  }

  private async logLiveStreamsList(
    accessToken: string,
    youtubeStreamId: string,
    phase: string,
  ): Promise<void> {
    const url = `https://www.googleapis.com/youtube/v3/liveStreams?part=id,status,snippet&id=${encodeURIComponent(youtubeStreamId)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await res.text();
    this.logger.log(
      `[youtube-live] liveStreams.list:${phase} youtubeStreamId=${youtubeStreamId} httpStatus=${res.status} body=${body.slice(0, 1000)}`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async endBroadcast(accountId: string, broadcastId: string): Promise<void> {
    const accessToken = await this.getValidAccessToken(accountId);
    try {
      await this.transitionBroadcast(accessToken, broadcastId, 'complete');
    } catch {
      // Broadcast may already be complete
    }
  }

  async getLiveViewerCount(
    accountId: string,
    broadcastId: string,
  ): Promise<number | null> {
    try {
      const accessToken = await this.getValidAccessToken(accountId);
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${encodeURIComponent(broadcastId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        items?: Array<{
          liveStreamingDetails?: { concurrentViewers?: string };
        }>;
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

  private async resolveBoundStreamId(
    accessToken: string,
    broadcastId: string,
  ): Promise<string | null> {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=contentDetails&id=${encodeURIComponent(broadcastId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      items?: Array<{ contentDetails?: { boundStreamId?: string } }>;
    };
    return data.items?.[0]?.contentDetails?.boundStreamId ?? null;
  }

  private async logBroadcastLifecycleSnapshot(
    accessToken: string,
    broadcastId: string,
    streamId: string,
    phase: string,
    meetingId?: string,
  ): Promise<void> {
    type BroadcastSnapshot = {
      status?: { lifeCycleStatus?: string };
      snippet?: { scheduledStartTime?: string; actualStartTime?: string };
      contentDetails?: {
        enableAutoStart?: boolean;
        enableAutoStop?: boolean;
        boundStreamId?: string;
      };
    };
    type StreamSnapshot = {
      status?: { streamStatus?: string; healthStatus?: string };
    };

    const [broadcastRes, streamRes] = await Promise.all([
      fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails&id=${encodeURIComponent(broadcastId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
      fetch(
        `https://www.googleapis.com/youtube/v3/liveStreams?part=status&id=${encodeURIComponent(streamId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    ]);

    const broadcastBody = await broadcastRes.text();
    const streamBody = await streamRes.text();

    let broadcast: BroadcastSnapshot | null = null;
    let stream: StreamSnapshot | null = null;

    try {
      const parsed = JSON.parse(broadcastBody) as {
        items?: BroadcastSnapshot[];
      };
      broadcast = parsed.items?.[0] ?? null;
    } catch {
      broadcast = null;
    }

    try {
      const parsed = JSON.parse(streamBody) as { items?: StreamSnapshot[] };
      stream = parsed.items?.[0] ?? null;
    } catch {
      stream = null;
    }

    this.logger.log(
      `[youtube-live] lifecycle:${phase} ${JSON.stringify({
        meetingId: meetingId ?? null,
        broadcastId,
        streamId,
        lifeCycleStatus: broadcast?.status?.lifeCycleStatus ?? null,
        streamStatus: stream?.status?.streamStatus ?? null,
        healthStatus: stream?.status?.healthStatus ?? null,
        scheduledStartTime: broadcast?.snippet?.scheduledStartTime ?? null,
        actualStartTime: broadcast?.snippet?.actualStartTime ?? null,
        enableAutoStart: broadcast?.contentDetails?.enableAutoStart ?? null,
        enableAutoStop: broadcast?.contentDetails?.enableAutoStop ?? null,
        boundStreamId: broadcast?.contentDetails?.boundStreamId ?? null,
      })}`,
    );
  }

  private async transitionBroadcast(
    accessToken: string,
    broadcastId: string,
    status: 'testing' | 'live' | 'complete',
  ): Promise<void> {
    const url = `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=${status}&id=${encodeURIComponent(broadcastId)}&part=snippet,status,contentDetails`;
    this.logger.log(
      `[youtube-live] transitionBroadcast:request targetStatus=${status} broadcastId=${broadcastId} url=${url}`,
    );

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const body = await res.text();
    if (!res.ok) {
      this.logger.error(
        `[youtube-live] transitionBroadcast:failed targetStatus=${status} broadcastId=${broadcastId} httpStatus=${res.status} body=${body.slice(0, 1000)}`,
      );
      throw new ServiceUnavailableException(
        `YouTube broadcast transition (${status}) failed: ${body.slice(0, 300)}`,
      );
    }

    let parsed: {
      id?: string;
      status?: { lifeCycleStatus?: string };
      snippet?: { actualStartTime?: string };
    } = {};
    try {
      parsed = JSON.parse(body) as typeof parsed;
    } catch {
      parsed = {};
    }

    this.logger.log(
      `[youtube-live] transitionBroadcast:success targetStatus=${status} ${JSON.stringify(
        {
          broadcastId: parsed?.id ?? broadcastId,
          lifeCycleStatus: parsed?.status?.lifeCycleStatus ?? null,
          actualStartTime: parsed?.snippet?.actualStartTime ?? null,
          responseBody: body.slice(0, 1000),
        },
      )}`,
    );
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

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encryptText } from '../common/crypto.util';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl',
];

@Injectable()
export class YoutubeService {
  constructor(private readonly prisma: PrismaService) {}

  private isOAuthConfigured(): boolean {
    return Boolean(
      process.env.YOUTUBE_CLIENT_ID?.trim() &&
      process.env.YOUTUBE_CLIENT_SECRET?.trim() &&
      process.env.YOUTUBE_REDIRECT_URI?.trim(),
    );
  }

  async getConnectionStatus(userId: string) {
    const account = await this.prisma.youTubeAccount.findUnique({
      where: { userId },
      select: {
        channelId: true,
        channelName: true,
        channelUrl: true,
        liveStreamingEnabled: true,
        tokenExpiresAt: true,
        updatedAt: true,
      },
    });

    return {
      connected: Boolean(account),
      oauthConfigured: this.isOAuthConfigured(),
      channel: account
        ? {
            id: account.channelId,
            name: account.channelName,
            url: account.channelUrl,
            liveStreamingEnabled: account.liveStreamingEnabled,
            tokenExpiresAt: account.tokenExpiresAt.toISOString(),
            connectedAt: account.updatedAt.toISOString(),
          }
        : null,
      message: account
        ? 'YouTube channel connected.'
        : this.isOAuthConfigured()
          ? 'Connect your YouTube channel to stream BoldMeet meetings live.'
          : 'Add YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REDIRECT_URI to enable OAuth.',
    };
  }

  getConnectUrl(userId: string) {
    if (!this.isOAuthConfigured()) {
      throw new ServiceUnavailableException(
        'YouTube OAuth is not configured. Add YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REDIRECT_URI.',
      );
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID!.trim();
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI!.trim();
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64url');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: YOUTUBE_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      scopes: YOUTUBE_SCOPES,
    };
  }

  /**
   * Exchange OAuth code for tokens, fetch channel metadata, and persist encrypted refresh token.
   * Full token exchange is wired when Google credentials are present in production.
   */
  async handleOAuthCallback(code: string, userId: string) {
    if (!this.isOAuthConfigured()) {
      throw new ServiceUnavailableException('YouTube OAuth is not configured.');
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID!.trim();
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET!.trim();
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI!.trim();

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

    if (!tokens.refresh_token) {
      throw new ServiceUnavailableException(
        'Google did not return a refresh token. Revoke app access and reconnect with consent.',
      );
    }

    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,status&mine=true',
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
        snippet?: { title?: string; customUrl?: string };
        status?: { longUploadsStatus?: string };
      }>;
    };

    const channel = channelData.items?.[0];
    if (!channel?.id) {
      throw new ServiceUnavailableException(
        'No YouTube channel found for this Google account.',
      );
    }

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const channelUrl = channel.snippet?.customUrl
      ? `https://www.youtube.com/${channel.snippet.customUrl}`
      : `https://www.youtube.com/channel/${channel.id}`;

    await this.prisma.youTubeAccount.upsert({
      where: { userId },
      create: {
        userId,
        channelId: channel.id,
        channelName: channel.snippet?.title ?? 'YouTube Channel',
        channelUrl,
        accessToken: encryptText(tokens.access_token),
        refreshToken: encryptText(tokens.refresh_token),
        tokenExpiresAt,
        liveStreamingEnabled: channel.status?.longUploadsStatus === 'allowed',
      },
      update: {
        channelId: channel.id,
        channelName: channel.snippet?.title ?? 'YouTube Channel',
        channelUrl,
        accessToken: encryptText(tokens.access_token),
        refreshToken: encryptText(tokens.refresh_token),
        tokenExpiresAt,
        liveStreamingEnabled: channel.status?.longUploadsStatus === 'allowed',
      },
    });

    return this.getConnectionStatus(userId);
  }

  async disconnect(userId: string) {
    await this.prisma.youTubeAccount.deleteMany({ where: { userId } });
    return { connected: false, message: 'YouTube channel disconnected.' };
  }

  getArchitecture() {
    return {
      version: '1.0',
      status: 'prepared',
      oauth: {
        provider: 'google',
        scopes: YOUTUBE_SCOPES,
        connectEndpoint: 'GET /youtube/connect',
        callbackEndpoint: 'GET /youtube/callback',
        disconnectEndpoint: 'POST /youtube/disconnect',
        tokenStorage: 'youtube_accounts (access + refresh encrypted at rest)',
      },
      liveStream: {
        startEndpoint: 'POST /meetings/:id/stream/start',
        stopEndpoint: 'POST /meetings/:id/stream/stop',
        statusEndpoint: 'GET /meetings/:id/stream',
        watchUrlField: 'youtube_streams.watchUrl',
        planGate: 'canStreamToYoutube (Pro)',
        featureFlag: 'NEXT_PUBLIC_ENABLE_YOUTUBE_LIVE',
      },
      flow: [
        'User upgrades to Pro',
        'User connects YouTube via OAuth (refresh token stored encrypted)',
        'Host starts meeting and clicks Start YouTube Live',
        'Bold creates RTMP ingest session and relays display capture',
        'watchUrl saved on youtube_streams when live',
        'Host stops stream from BoldMeet; session marked ENDED',
      ],
    };
  }
}

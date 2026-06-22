import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ParticipantRole,
  ParticipantStatus,
  StreamStatus,
  StreamVisibility,
  StreamingProviderType,
} from '@prisma/client';
import {
  DEFAULT_YOUTUBE_RTMP_URL,
  LiveStreamSessionView,
  MeetingBroadcastProviderType,
  PublicLiveStreamView,
  StartLiveStreamResult,
  StreamIngestSession,
  getYoutubePlanLimits,
  type YouTubePrivacyStatus,
} from '@boldmeet/shared';
import { isMaxPlanLaunched } from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../subscriptions/permissions.service';
import { MeetingGateway } from '../gateway/meeting.gateway';
import { decryptText, encryptText } from '../common/crypto.util';
import { StreamRelayService } from './stream-relay.service';
import { StartStreamDto } from './dto/start-stream.dto';
import {
  CustomRtmpBroadcastProvider,
  MeetingBroadcastProviderRegistry,
  YoutubeRtmpBroadcastProvider,
} from './stream.providers';
import { YoutubeService } from '../youtube/youtube.service';

const HOST_DISCONNECT_STOP_MS = 60_000;

@Injectable()
export class StreamService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StreamService.name);
  private registry: MeetingBroadcastProviderRegistry;
  private staleCheckTimer: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsService,
    private relay: StreamRelayService,
    private gateway: MeetingGateway,
    private youtube: YoutubeService,
    youtubeProvider: YoutubeRtmpBroadcastProvider,
    custom: CustomRtmpBroadcastProvider,
  ) {
    this.registry = new MeetingBroadcastProviderRegistry(youtubeProvider, custom);
  }

  onModuleInit() {
    this.staleCheckTimer = setInterval(() => {
      void this.stopStaleRelays();
    }, 15_000);
    this.staleCheckTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.staleCheckTimer) clearInterval(this.staleCheckTimer);
  }

  private async stopStaleRelays() {
    const stale = this.relay.getStaleRelays(HOST_DISCONNECT_STOP_MS);
    for (const relay of stale) {
      this.logger.warn(
        `[stream] auto-stopping stale relay ${relay.streamId} (no ingest for ${HOST_DISCONNECT_STOP_MS}ms)`,
      );
      await this.finalizeStop(relay.streamId, relay.meetingId);
    }
  }

  async getForModerator(
    meetingId: string,
    userId: string,
  ): Promise<LiveStreamSessionView | null> {
    await this.assertCanManageBroadcast(meetingId, userId);
    const streams = await this.prisma.youTubeStream.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'asc' },
    });
    if (streams.length === 0) return null;

    const liveStreams = streams.filter((s) => s.status === StreamStatus.LIVE);
    const activeStreams = liveStreams.length > 0 ? liveStreams : [streams[streams.length - 1]];

    for (const stream of activeStreams) {
      if (stream.status === StreamStatus.LIVE && !this.relay.isRunning(stream.id)) {
        await this.failOrphanedStream(stream.id, meetingId);
      }
    }

    const refreshed = await this.prisma.youTubeStream.findMany({
      where: { meetingId, status: { in: [StreamStatus.LIVE, StreamStatus.IDLE] } },
      orderBy: { createdAt: 'asc' },
    });
    const stillLive = refreshed.filter((s) => s.status === StreamStatus.LIVE);
    if (stillLive.length === 0) {
      const latest = await this.prisma.youTubeStream.findFirst({
        where: { meetingId },
        orderBy: { createdAt: 'desc' },
      });
      return latest ? await this.toView(latest) : null;
    }

    return await this.toAggregateView(stillLive);
  }

  async getPublic(meetingId: string): Promise<PublicLiveStreamView> {
    const streams = await this.prisma.youTubeStream.findMany({
      where: { meetingId, status: StreamStatus.LIVE },
      orderBy: { createdAt: 'asc' },
    });
    const live = streams.find((s) => this.relay.isRunning(s.id));
    if (!live) {
      return { isLive: false, status: 'IDLE' };
    }
    return {
      isLive: true,
      status: live.status,
      title: live.title,
      watchUrl: live.watchUrl,
      startedAt: live.startedAt?.toISOString() ?? null,
      provider: live.provider as MeetingBroadcastProviderType,
    };
  }

  async start(
    meetingId: string,
    actorUserId: string,
    dto: StartStreamDto,
  ): Promise<StartLiveStreamResult> {
    const meeting = await this.assertCanManageBroadcast(meetingId, actorUserId);
    await this.permissions.check(actorUserId, 'canStreamToYoutube');

    const providerType = dto.provider as MeetingBroadcastProviderType;
    if (providerType === MeetingBroadcastProviderType.NONE) {
      throw new BadRequestException('Select a broadcast provider');
    }

    const providerImpl = this.registry.get(providerType);
    if (!providerImpl) {
      throw new BadRequestException('Unsupported broadcast provider');
    }

    const existingLive = await this.prisma.youTubeStream.count({
      where: { meetingId, status: StreamStatus.LIVE },
    });
    if (existingLive > 0) {
      throw new BadRequestException(
        'YouTube Live is already active for this meeting. Use Resume Stream if you refreshed the page.',
      );
    }

    const host = await this.prisma.user.findUnique({
      where: { id: meeting.hostId },
      select: { name: true, email: true },
    });
    const hostName = host?.name?.trim() || host?.email?.split('@')[0] || 'Host';
    const streamTitle = this.resolveStreamTitle(meeting.title, dto.title);
    const description = this.buildStreamDescription(streamTitle, hostName);
    const privacyStatus: YouTubePrivacyStatus = dto.visibility ?? 'unlisted';
    const visibility = this.mapVisibility(privacyStatus);

    if (providerType === MeetingBroadcastProviderType.YOUTUBE_RTMP && !dto.streamKey?.trim()) {
      const accountIds = this.resolveYoutubeAccountIds(dto);
      await this.assertDestinationLimits(actorUserId, accountIds.length);
      return this.startYoutubeApiStreams({
        meetingId,
        actorUserId,
        accountIds,
        streamTitle,
        description,
        privacyStatus,
        visibility,
        providerType,
      });
    }

    if (!dto.streamKey?.trim()) {
      throw new BadRequestException('Stream key is required for manual RTMP mode');
    }
    if (providerType === MeetingBroadcastProviderType.CUSTOM_RTMP && !dto.rtmpUrl?.trim()) {
      throw new BadRequestException('RTMP URL is required for custom streaming');
    }

    const rtmpUrl =
      providerType === MeetingBroadcastProviderType.YOUTUBE_RTMP
        ? providerImpl.normalizeRtmpUrl(dto.rtmpUrl || DEFAULT_YOUTUBE_RTMP_URL)
        : providerImpl.normalizeRtmpUrl(dto.rtmpUrl!);
    const streamKey = dto.streamKey.trim();
    const validationError = providerImpl.validateInput({ rtmpUrl, streamKey });
    if (validationError) {
      throw new BadRequestException(validationError);
    }
    const watchUrl = await this.resolveWatchUrl(actorUserId, dto.watchUrl);
    const outputUrl = providerImpl.buildOutputUrl(rtmpUrl, streamKey);
    const encryptedKey = encryptText(streamKey);

    const stream = await this.prisma.youTubeStream.create({
      data: {
        meetingId,
        youtubeAccountId: null,
        provider: dto.provider as StreamingProviderType,
        title: streamTitle,
        rtmpUrl,
        streamKey: encryptedKey,
        watchUrl,
        visibility,
        status: StreamStatus.IDLE,
      },
    });

    const relayResult = this.relay.start({
      streamId: stream.id,
      meetingId,
      outputUrl,
    });

    if (!relayResult.ok) {
      await this.prisma.youTubeStream.update({
        where: { id: stream.id },
        data: { status: StreamStatus.ERROR, endedAt: new Date() },
      });
      throw new ServiceUnavailableException(
        relayResult.error.includes('ENOENT')
          ? 'FFmpeg is not available on the server. Install ffmpeg to enable live streaming.'
          : relayResult.error,
      );
    }

    const startedAt = new Date();
    const updated = await this.prisma.youTubeStream.update({
      where: { id: stream.id },
      data: { status: StreamStatus.LIVE, startedAt },
    });

    const view = await this.toView(updated);
    this.gateway.broadcastStreamLive(meetingId, {
      title: streamTitle,
      watchUrl,
      provider: dto.provider,
      startedAt: view.startedAt ?? startedAt.toISOString(),
      status: 'LIVE',
    });

    return {
      ...view,
      ingestToken: relayResult.ingestToken,
      sessions: [{ id: stream.id, ingestToken: relayResult.ingestToken, watchUrl }],
    };
  }

  private resolveYoutubeAccountIds(dto: StartStreamDto): string[] {
    const fromArray = (dto.youtubeAccountIds ?? [])
      .map((id) => id.trim())
      .filter(Boolean);
    if (fromArray.length > 0) {
      return [...new Set(fromArray)];
    }
    const legacy = dto.youtubeAccountId?.trim();
    if (legacy) return [legacy];
    throw new BadRequestException('Select at least one YouTube channel before going live.');
  }

  private async assertDestinationLimits(userId: string, destinationCount: number) {
    const { plan } = await this.permissions.getUserPlanContext(userId);
    const enterpriseMax = process.env.ENTERPRISE_MAX_YOUTUBE_CHANNELS?.trim();
    const parsed = enterpriseMax ? Number.parseInt(enterpriseMax, 10) : undefined;
    const limits = getYoutubePlanLimits(plan, {
      enterpriseMaxChannels: Number.isFinite(parsed) ? parsed : undefined,
    });
    if (!isMaxPlanLaunched() && destinationCount > 1) {
      throw new ForbiddenException(
        'Simultaneous multi-channel streaming launches with Max. Join the waitlist for early access.',
      );
    }
    if (destinationCount > limits.maxSimultaneousDestinations) {
      throw new ForbiddenException(
        `Your ${limits.tierLabel} plan allows ${limits.maxSimultaneousDestinations} simultaneous destination(s).`,
      );
    }
  }

  private async startYoutubeApiStreams(input: {
    meetingId: string;
    actorUserId: string;
    accountIds: string[];
    streamTitle: string;
    description: string;
    privacyStatus: YouTubePrivacyStatus;
    visibility: StreamVisibility;
    providerType: MeetingBroadcastProviderType;
  }): Promise<StartLiveStreamResult> {
    const providerImpl = this.registry.get(MeetingBroadcastProviderType.YOUTUBE_RTMP)!;
    const created: Array<{
      streamId: string;
      accountId: string;
      broadcastId: string;
      ingestToken: string;
      watchUrl: string;
      channelName: string;
    }> = [];

    try {
      for (const accountId of input.accountIds) {
        const account = await this.prisma.youTubeAccount.findFirst({
          where: { id: accountId, userId: input.actorUserId },
        });
        if (!account) {
          throw new BadRequestException('One or more selected YouTube channels were not found.');
        }
        if (!account.liveStreamingEnabled) {
          throw new BadRequestException(
            `${account.channelName} is not enabled for live streaming. Enable it in Settings → Integrations.`,
          );
        }

        const session = await this.youtube.createLiveSession(accountId, input.actorUserId, {
          title: input.streamTitle,
          description: input.description,
          privacyStatus: input.privacyStatus,
        });

        const outputUrl = providerImpl.buildOutputUrl(session.rtmpUrl, session.streamKey);
        const encryptedKey = encryptText(session.streamKey);

        const stream = await this.prisma.youTubeStream.upsert({
          where: {
            meetingId_youtubeAccountId: {
              meetingId: input.meetingId,
              youtubeAccountId: accountId,
            },
          },
          create: {
            meetingId: input.meetingId,
            youtubeAccountId: accountId,
            provider: StreamingProviderType.YOUTUBE_RTMP,
            title: input.streamTitle,
            broadcastId: session.broadcastId,
            streamId: session.streamId,
            rtmpUrl: session.rtmpUrl,
            streamKey: encryptedKey,
            watchUrl: session.watchUrl,
            visibility: input.visibility,
            status: StreamStatus.IDLE,
          },
          update: {
            title: input.streamTitle,
            broadcastId: session.broadcastId,
            streamId: session.streamId,
            rtmpUrl: session.rtmpUrl,
            streamKey: encryptedKey,
            watchUrl: session.watchUrl,
            visibility: input.visibility,
            status: StreamStatus.IDLE,
            endedAt: null,
          },
        });

        const relayResult = this.relay.start({
          streamId: stream.id,
          meetingId: input.meetingId,
          outputUrl,
        });

        if (!relayResult.ok) {
          throw new ServiceUnavailableException(
            relayResult.error.includes('ENOENT')
              ? 'FFmpeg is not available on the server. Install ffmpeg to enable live streaming.'
              : relayResult.error,
          );
        }

        created.push({
          streamId: stream.id,
          accountId,
          broadcastId: session.broadcastId,
          ingestToken: relayResult.ingestToken,
          watchUrl: session.watchUrl,
          channelName: account.channelName,
        });
      }

      for (const item of created) {
        await this.youtube.transitionBroadcastToLive(item.accountId, item.broadcastId);
      }

      const startedAt = new Date();
      await this.prisma.youTubeStream.updateMany({
        where: { id: { in: created.map((c) => c.streamId) } },
        data: { status: StreamStatus.LIVE, startedAt },
      });

      const streams = await this.prisma.youTubeStream.findMany({
        where: { id: { in: created.map((c) => c.streamId) } },
        orderBy: { createdAt: 'asc' },
      });

      const aggregate = await this.toAggregateView(streams);
      const sessions: StreamIngestSession[] = created.map((c) => ({
        id: c.streamId,
        ingestToken: c.ingestToken,
        watchUrl: c.watchUrl,
        channelName: c.channelName,
        youtubeAccountId: c.accountId,
      }));

      this.gateway.broadcastStreamLive(input.meetingId, {
        title: input.streamTitle,
        watchUrl: sessions[0]?.watchUrl ?? undefined,
        provider: input.providerType,
        startedAt: aggregate.startedAt ?? startedAt.toISOString(),
        status: 'LIVE',
      });

      return {
        ...aggregate,
        ingestToken: sessions[0]!.ingestToken,
        sessions,
      };
    } catch (error) {
      for (const item of created) {
        this.relay.stop(item.streamId);
        await this.youtube.endBroadcast(item.accountId, item.broadcastId).catch(() => undefined);
        await this.prisma.youTubeStream.update({
          where: { id: item.streamId },
          data: { status: StreamStatus.ERROR, endedAt: new Date() },
        });
      }
      throw error;
    }
  }

  async resume(meetingId: string, actorUserId: string): Promise<StartLiveStreamResult> {
    await this.assertCanManageBroadcast(meetingId, actorUserId);
    await this.permissions.check(actorUserId, 'canStreamToYoutube');

    const streams = await this.prisma.youTubeStream.findMany({
      where: { meetingId, status: StreamStatus.LIVE },
      orderBy: { createdAt: 'asc' },
    });
    if (streams.length === 0) {
      throw new BadRequestException('No active YouTube Live session to resume');
    }

    const sessions: StreamIngestSession[] = [];

    for (const stream of streams) {
      if (this.relay.isRunning(stream.id)) {
        const ingestToken = this.relay.reissueIngestToken(stream.id);
        if (!ingestToken) {
          throw new ServiceUnavailableException('Could not resume stream relay');
        }
        const account = stream.youtubeAccountId
          ? await this.prisma.youTubeAccount.findUnique({
              where: { id: stream.youtubeAccountId },
              select: { channelName: true },
            })
          : null;
        sessions.push({
          id: stream.id,
          ingestToken,
          watchUrl: stream.watchUrl,
          youtubeAccountId: stream.youtubeAccountId,
          channelName: account?.channelName ?? null,
        });
        continue;
      }

      const streamKey = stream.streamKey ? decryptText(stream.streamKey) : null;
      if (!streamKey || !stream.rtmpUrl) {
        await this.failOrphanedStream(stream.id, meetingId);
        throw new BadRequestException(
          'Stream recovery failed — relay expired. Stop and start a new YouTube Live session.',
        );
      }

      const providerImpl = this.registry.get(stream.provider as MeetingBroadcastProviderType);
      if (!providerImpl) {
        await this.failOrphanedStream(stream.id, meetingId);
        throw new BadRequestException('Unsupported broadcast provider for recovery');
      }

      const outputUrl = providerImpl.buildOutputUrl(stream.rtmpUrl, streamKey);
      const relayResult = this.relay.start({
        streamId: stream.id,
        meetingId,
        outputUrl,
      });

      if (!relayResult.ok) {
        await this.failOrphanedStream(stream.id, meetingId);
        throw new ServiceUnavailableException(
          'Stream recovery failed — could not restart server relay. Stop and start again.',
        );
      }

      if (stream.broadcastId && stream.youtubeAccountId) {
        try {
          await this.youtube.transitionBroadcastToLive(
            stream.youtubeAccountId,
            stream.broadcastId,
          );
        } catch {
          await this.failOrphanedStream(stream.id, meetingId);
          throw new ServiceUnavailableException(
            'Stream recovery failed — could not resume YouTube broadcast.',
          );
        }
      }

      const account = stream.youtubeAccountId
        ? await this.prisma.youTubeAccount.findUnique({
            where: { id: stream.youtubeAccountId },
            select: { channelName: true },
          })
        : null;
      sessions.push({
        id: stream.id,
        ingestToken: relayResult.ingestToken,
        watchUrl: stream.watchUrl,
        youtubeAccountId: stream.youtubeAccountId,
        channelName: account?.channelName ?? null,
      });
    }

    const aggregate = await this.toAggregateView(streams);
    return {
      ...aggregate,
      ingestToken: sessions[0]!.ingestToken,
      sessions,
    };
  }

  async stop(meetingId: string, actorUserId: string): Promise<LiveStreamSessionView> {
    await this.assertCanManageBroadcast(meetingId, actorUserId);

    const streams = await this.prisma.youTubeStream.findMany({
      where: { meetingId, status: StreamStatus.LIVE },
    });
    if (streams.length === 0) {
      const latest = await this.prisma.youTubeStream.findFirst({
        where: { meetingId },
        orderBy: { createdAt: 'desc' },
      });
      if (!latest) {
        throw new NotFoundException('No YouTube Live session for this meeting');
      }
      return this.toView(latest);
    }

    let lastView: LiveStreamSessionView | null = null;
    for (const stream of streams) {
      lastView = await this.finalizeStop(stream.id, meetingId, streams.length === 1);
    }
    return lastView!;
  }

  async stopIfLiveQuiet(meetingId: string): Promise<void> {
    const streams = await this.prisma.youTubeStream.findMany({
      where: { meetingId, status: StreamStatus.LIVE },
    });
    if (streams.length === 0) return;
    for (const stream of streams) {
      await this.finalizeStop(stream.id, meetingId, false);
    }
    if (streams.length > 0) {
      this.gateway.broadcastStreamStopped(meetingId);
    }
  }

  private async finalizeStop(
    streamId: string,
    meetingId: string,
    broadcastStopped = true,
  ): Promise<LiveStreamSessionView> {
    const stream = await this.prisma.youTubeStream.findUnique({ where: { id: streamId } });
    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    this.relay.stop(streamId);

    if (stream.broadcastId && stream.youtubeAccountId) {
      await this.youtube.endBroadcast(stream.youtubeAccountId, stream.broadcastId).catch((error) => {
        this.logger.warn(`[stream] endBroadcast failed for ${stream.broadcastId}: ${error}`);
      });
    }

    const updated = await this.prisma.youTubeStream.update({
      where: { id: streamId },
      data: {
        status: StreamStatus.ENDED,
        endedAt: new Date(),
      },
    });

    if (broadcastStopped) {
      this.gateway.broadcastStreamStopped(meetingId);
    }
    return await this.toView(updated);
  }

  private async failOrphanedStream(streamId: string, meetingId: string) {
    const stream = await this.prisma.youTubeStream.findUnique({ where: { id: streamId } });
    this.relay.stop(streamId);
    if (stream?.broadcastId && stream.youtubeAccountId) {
      await this.youtube
        .endBroadcast(stream.youtubeAccountId, stream.broadcastId)
        .catch(() => undefined);
    }
    await this.prisma.youTubeStream.update({
      where: { id: streamId },
      data: { status: StreamStatus.ERROR, endedAt: new Date() },
    });
    this.gateway.broadcastStreamStopped(meetingId);
  }

  private resolveStreamTitle(meetingTitle: string, override?: string): string {
    const custom = override?.trim();
    if (custom) return custom;
    const title = meetingTitle?.trim();
    if (title) return title;
    return 'Bold Meeting';
  }

  private buildStreamDescription(meetingTitle: string, hostName: string): string {
    return [meetingTitle, hostName, 'Powered by Bold'].join('\n');
  }

  private mapVisibility(privacy: YouTubePrivacyStatus): StreamVisibility {
    switch (privacy) {
      case 'public':
        return StreamVisibility.PUBLIC;
      case 'private':
        return StreamVisibility.PRIVATE;
      default:
        return StreamVisibility.UNLISTED;
    }
  }

  private mapVisibilityToApi(visibility: StreamVisibility): YouTubePrivacyStatus {
    switch (visibility) {
      case StreamVisibility.PUBLIC:
        return 'public';
      case StreamVisibility.PRIVATE:
        return 'private';
      default:
        return 'unlisted';
    }
  }

  private async resolveWatchUrl(userId: string, explicit?: string | null): Promise<string> {
    if (explicit?.trim()) return explicit.trim();

    const account = await this.prisma.youTubeAccount.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { channelId: true, channelUrl: true },
    });

    if (!account) {
      return 'https://www.youtube.com/live';
    }

    return account.channelUrl
      ? `${account.channelUrl.replace(/\/$/, '')}/live`
      : `https://www.youtube.com/channel/${account.channelId}/live`;
  }

  private async assertCanManageBroadcast(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, hostId: true, status: true, title: true },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    if (meeting.hostId === userId) {
      return meeting;
    }

    const coHost = await this.prisma.participant.findFirst({
      where: {
        meetingId,
        userId,
        role: ParticipantRole.CO_HOST,
        status: ParticipantStatus.ADMITTED,
      },
    });

    if (!coHost) {
      throw new ForbiddenException('Only the host or co-host can manage YouTube Live');
    }

    return meeting;
  }

  private async toAggregateView(
    streams: Array<{
      id: string;
      meetingId: string;
      youtubeAccountId: string | null;
      provider: StreamingProviderType;
      title: string | null;
      broadcastId: string | null;
      rtmpUrl: string | null;
      watchUrl: string | null;
      visibility: StreamVisibility;
      status: StreamStatus;
      startedAt: Date | null;
      endedAt: Date | null;
    }>,
  ): Promise<LiveStreamSessionView> {
    const primary = streams[0]!;
    const destinations = await Promise.all(
      streams.map(async (stream) => {
        const relayActive = this.relay.isRunning(stream.id);
        let viewerCount: number | null = null;
        if (
          stream.youtubeAccountId &&
          stream.broadcastId &&
          stream.status === StreamStatus.LIVE &&
          relayActive
        ) {
          viewerCount = await this.youtube.getLiveViewerCount(
            stream.youtubeAccountId,
            stream.broadcastId,
          );
        }
        const account = stream.youtubeAccountId
          ? await this.prisma.youTubeAccount.findUnique({
              where: { id: stream.youtubeAccountId },
              select: { channelName: true },
            })
          : null;
        return {
          id: stream.id,
          youtubeAccountId: stream.youtubeAccountId,
          channelName: account?.channelName ?? null,
          watchUrl: stream.watchUrl,
          status: stream.status,
          viewerCount,
        };
      }),
    );

    const totalViewers = destinations.reduce(
      (sum, d) => sum + (d.viewerCount ?? 0),
      0,
    );

    return {
      id: primary.id,
      meetingId: primary.meetingId,
      provider: primary.provider as MeetingBroadcastProviderType,
      title: primary.title,
      watchUrl: primary.watchUrl,
      status: primary.status,
      startedAt: primary.startedAt?.toISOString() ?? null,
      endedAt: primary.endedAt?.toISOString() ?? null,
      relayActive: streams.some((s) => this.relay.isRunning(s.id)),
      canResume: streams.some((s) => s.status === StreamStatus.LIVE),
      captureActive: false,
      viewerCount: totalViewers > 0 ? totalViewers : null,
      visibility: this.mapVisibilityToApi(primary.visibility),
      destinations,
    };
  }

  private async toView(
    stream: {
      id: string;
      meetingId: string;
      youtubeAccountId: string | null;
      provider: StreamingProviderType;
      title: string | null;
      broadcastId: string | null;
      rtmpUrl: string | null;
      watchUrl: string | null;
      visibility: StreamVisibility;
      status: StreamStatus;
      startedAt: Date | null;
      endedAt: Date | null;
    },
  ): Promise<LiveStreamSessionView> {
    const relayActive = this.relay.isRunning(stream.id);
    let viewerCount: number | null = null;
    if (
      stream.youtubeAccountId &&
      stream.broadcastId &&
      stream.status === StreamStatus.LIVE &&
      relayActive
    ) {
      viewerCount = await this.youtube.getLiveViewerCount(
        stream.youtubeAccountId,
        stream.broadcastId,
      );
    }

    return {
      id: stream.id,
      meetingId: stream.meetingId,
      provider: stream.provider as MeetingBroadcastProviderType,
      title: stream.title,
      watchUrl: stream.watchUrl,
      status: stream.status,
      startedAt: stream.startedAt?.toISOString() ?? null,
      endedAt: stream.endedAt?.toISOString() ?? null,
      relayActive,
      canResume: stream.status === StreamStatus.LIVE,
      captureActive: false,
      viewerCount,
      visibility: this.mapVisibilityToApi(stream.visibility),
      destinations: [
        {
          id: stream.id,
          youtubeAccountId: stream.youtubeAccountId,
          channelName: null,
          watchUrl: stream.watchUrl,
          status: stream.status,
          viewerCount,
        },
      ],
    };
  }
}

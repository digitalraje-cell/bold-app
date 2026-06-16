import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ParticipantRole,
  ParticipantStatus,
  StreamStatus,
  StreamingProviderType,
} from '@prisma/client';
import {
  DEFAULT_YOUTUBE_RTMP_URL,
  LiveStreamSessionView,
  MeetingBroadcastProviderType,
  PublicLiveStreamView,
  StartLiveStreamResult,
} from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../subscriptions/permissions.service';
import { MeetingGateway } from '../gateway/meeting.gateway';
import { encryptText } from '../common/crypto.util';
import { StreamRelayService } from './stream-relay.service';
import { StartStreamDto } from './dto/start-stream.dto';
import {
  CustomRtmpBroadcastProvider,
  MeetingBroadcastProviderRegistry,
  YoutubeRtmpBroadcastProvider,
} from './stream.providers';

@Injectable()
export class StreamService {
  private registry: MeetingBroadcastProviderRegistry;

  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsService,
    private relay: StreamRelayService,
    private gateway: MeetingGateway,
    youtube: YoutubeRtmpBroadcastProvider,
    custom: CustomRtmpBroadcastProvider,
  ) {
    this.registry = new MeetingBroadcastProviderRegistry(youtube, custom);
  }

  async getForModerator(
    meetingId: string,
    userId: string,
  ): Promise<LiveStreamSessionView | null> {
    await this.assertCanManageBroadcast(meetingId, userId);
    const stream = await this.prisma.youTubeStream.findUnique({ where: { meetingId } });
    return stream ? this.toView(stream) : null;
  }

  async getPublic(meetingId: string): Promise<PublicLiveStreamView> {
    const stream = await this.prisma.youTubeStream.findUnique({ where: { meetingId } });
    if (!stream) {
      return { isLive: false, status: 'IDLE' };
    }
    return {
      isLive: stream.status === StreamStatus.LIVE,
      status: stream.status,
      title: stream.title,
      watchUrl: stream.watchUrl,
      startedAt: stream.startedAt?.toISOString() ?? null,
      provider: stream.provider as MeetingBroadcastProviderType,
    };
  }

  async start(
    meetingId: string,
    actorUserId: string,
    dto: StartStreamDto,
  ): Promise<StartLiveStreamResult> {
    const meeting = await this.assertCanManageBroadcast(meetingId, actorUserId);
    await this.permissions.check(meeting.hostId, 'canStreamToYoutube');

    const providerType = dto.provider as MeetingBroadcastProviderType;

    if (providerType === MeetingBroadcastProviderType.NONE) {
      throw new BadRequestException('Select a broadcast provider');
    }

    const providerImpl = this.registry.get(providerType);
    if (!providerImpl) {
      throw new BadRequestException('Unsupported broadcast provider');
    }

    if (providerType === MeetingBroadcastProviderType.CUSTOM_RTMP && !dto.rtmpUrl?.trim()) {
      throw new BadRequestException('RTMP URL is required for custom streaming');
    }

    const rtmpUrl =
      providerType === MeetingBroadcastProviderType.YOUTUBE_RTMP
        ? providerImpl.normalizeRtmpUrl(dto.rtmpUrl || DEFAULT_YOUTUBE_RTMP_URL)
        : providerImpl.normalizeRtmpUrl(dto.rtmpUrl!);

    const validationError = providerImpl.validateInput({
      rtmpUrl,
      streamKey: dto.streamKey,
    });
    if (validationError) {
      throw new BadRequestException(validationError);
    }

    const existing = await this.prisma.youTubeStream.findUnique({ where: { meetingId } });
    if (existing?.status === StreamStatus.LIVE) {
      throw new BadRequestException('YouTube Live is already running for this meeting');
    }

    const outputUrl = providerImpl.buildOutputUrl(rtmpUrl, dto.streamKey);
    const encryptedKey = encryptText(dto.streamKey);

    const stream = await this.prisma.youTubeStream.upsert({
      where: { meetingId },
      create: {
        meetingId,
        provider: dto.provider as StreamingProviderType,
        title: dto.title,
        rtmpUrl,
        streamKey: encryptedKey,
        watchUrl: dto.watchUrl,
        status: StreamStatus.IDLE,
      },
      update: {
        provider: dto.provider as StreamingProviderType,
        title: dto.title,
        rtmpUrl,
        streamKey: encryptedKey,
        watchUrl: dto.watchUrl,
        status: StreamStatus.IDLE,
        endedAt: null,
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

    const view = this.toView(updated);
    this.gateway.broadcastStreamLive(meetingId, {
      title: dto.title,
      watchUrl: dto.watchUrl,
      provider: dto.provider,
      startedAt: view.startedAt ?? startedAt.toISOString(),
      status: 'LIVE',
    });

    return {
      ...view,
      ingestToken: relayResult.ingestToken,
    };
  }

  async stop(meetingId: string, actorUserId: string): Promise<LiveStreamSessionView> {
    await this.assertCanManageBroadcast(meetingId, actorUserId);

    const stream = await this.prisma.youTubeStream.findUnique({ where: { meetingId } });
    if (!stream) {
      throw new NotFoundException('No YouTube Live session for this meeting');
    }

    if (stream.status === StreamStatus.LIVE) {
      this.relay.stop(stream.id);
    }

    const updated = await this.prisma.youTubeStream.update({
      where: { id: stream.id },
      data: { status: StreamStatus.ENDED, endedAt: new Date() },
    });

    this.gateway.broadcastStreamStopped(meetingId);

    return this.toView(updated);
  }

  private async assertCanManageBroadcast(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, hostId: true, status: true },
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

  private toView(stream: {
    id: string;
    meetingId: string;
    provider: StreamingProviderType;
    title: string | null;
    rtmpUrl: string | null;
    watchUrl: string | null;
    status: StreamStatus;
    startedAt: Date | null;
    endedAt: Date | null;
  }): LiveStreamSessionView {
    return {
      id: stream.id,
      meetingId: stream.meetingId,
      provider: stream.provider as MeetingBroadcastProviderType,
      title: stream.title,
      rtmpUrl: stream.rtmpUrl,
      watchUrl: stream.watchUrl,
      status: stream.status,
      startedAt: stream.startedAt?.toISOString() ?? null,
      endedAt: stream.endedAt?.toISOString() ?? null,
    };
  }
}

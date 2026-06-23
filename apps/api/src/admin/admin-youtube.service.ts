import { Injectable } from '@nestjs/common';
import { StreamStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminYoutubeService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      channelsConnected,
      liveEnabledChannels,
      streamsCreated,
      activeStreams,
      completedStreams,
    ] = await Promise.all([
      this.prisma.youTubeAccount.count(),
      this.prisma.youTubeAccount.count({
        where: { liveStreamingEnabled: true },
      }),
      this.prisma.youTubeStream.count(),
      this.prisma.youTubeStream.count({ where: { status: StreamStatus.LIVE } }),
      this.prisma.youTubeStream.findMany({
        where: {
          status: { in: [StreamStatus.ENDED, StreamStatus.ERROR] },
          startedAt: { not: null },
          endedAt: { not: null },
        },
        select: { startedAt: true, endedAt: true },
      }),
    ]);

    const totalMs = completedStreams.reduce((sum, stream) => {
      if (!stream.startedAt || !stream.endedAt) return sum;
      return sum + (stream.endedAt.getTime() - stream.startedAt.getTime());
    }, 0);

    const hoursStreamed = Math.round((totalMs / 3_600_000) * 10) / 10;

    const recentStreams = await this.prisma.youTubeStream.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        meetingId: true,
        title: true,
        status: true,
        watchUrl: true,
        visibility: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
        meeting: {
          select: {
            title: true,
            host: { select: { email: true, name: true } },
          },
        },
      },
    });

    return {
      channelsConnected,
      liveEnabledChannels,
      streamsCreated,
      activeStreams,
      hoursStreamed,
      recentStreams: recentStreams.map((stream) => ({
        id: stream.id,
        meetingId: stream.meetingId,
        meetingTitle: stream.meeting.title,
        hostEmail: stream.meeting.host.email,
        hostName: stream.meeting.host.name,
        title: stream.title,
        status: stream.status,
        watchUrl: stream.watchUrl,
        visibility: stream.visibility,
        startedAt: stream.startedAt?.toISOString() ?? null,
        endedAt: stream.endedAt?.toISOString() ?? null,
        createdAt: stream.createdAt.toISOString(),
      })),
    };
  }
}

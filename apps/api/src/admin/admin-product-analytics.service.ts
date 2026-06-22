import { Injectable } from '@nestjs/common';
import { MeetingStatus, PlanInterestType, StreamStatus, SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminFeatureInterestService } from './admin-feature-interest.service';

@Injectable()
export class AdminProductAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureInterest: AdminFeatureInterestService,
  ) {}

  async getStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      freeUsers,
      proUsers,
      maxWaitlist,
      meetingsCreated,
      meetingsHosted,
      completedMeetings,
      pwaInstalledUsers,
      youtubeStreamsCreated,
      connectedChannels,
      activeUsers7d,
      activeUsers30d,
      featureInterest,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { subscriptionPlan: SubscriptionPlan.FREE } }),
      this.prisma.user.count({ where: { subscriptionPlan: SubscriptionPlan.PRO } }),
      this.prisma.planInterest.count({ where: { planInterest: PlanInterestType.MAX } }),
      this.prisma.meeting.count(),
      this.prisma.meeting.groupBy({ by: ['hostId'], _count: { hostId: true } }).then((r) => r.length),
      this.prisma.meeting.findMany({
        where: {
          status: MeetingStatus.ENDED,
          startedAt: { not: null },
          endedAt: { not: null },
        },
        select: { startedAt: true, endedAt: true },
      }),
      this.prisma.user.count({ where: { isPwaInstalled: true } }),
      this.prisma.youTubeStream.count(),
      this.prisma.youTubeAccount.count(),
      this.prisma.user.count({
        where: {
          OR: [
            { lastPwaLaunchAt: { gte: sevenDaysAgo } },
            { hostedMeetings: { some: { createdAt: { gte: sevenDaysAgo } } } },
            { participants: { some: { joinedAt: { gte: sevenDaysAgo } } } },
          ],
        },
      }),
      this.prisma.user.count({
        where: {
          OR: [
            { lastPwaLaunchAt: { gte: thirtyDaysAgo } },
            { hostedMeetings: { some: { createdAt: { gte: thirtyDaysAgo } } } },
            { participants: { some: { joinedAt: { gte: thirtyDaysAgo } } } },
          ],
        },
      }),
      this.featureInterest.getStats(),
    ]);

    const totalMs = completedMeetings.reduce((sum, m) => {
      if (!m.startedAt || !m.endedAt) return sum;
      return sum + (m.endedAt.getTime() - m.startedAt.getTime());
    }, 0);
    const avgMeetingDurationMinutes =
      completedMeetings.length > 0
        ? Math.round(totalMs / completedMeetings.length / 60_000)
        : 0;

    const activeStreams = await this.prisma.youTubeStream.count({
      where: { status: StreamStatus.LIVE },
    });

    return {
      totalUsers,
      activeUsers7d,
      activeUsers30d,
      freeUsers,
      proUsers,
      maxWaitlist,
      meetingsCreated,
      meetingsHosted,
      avgMeetingDurationMinutes,
      pwaInstalls: pwaInstalledUsers,
      youtubeStreamsCreated,
      activeYoutubeStreams: activeStreams,
      connectedChannels,
      featureInterestDemand: {
        waitlistTotal: featureInterest.maxWaitlistTotal,
        providerDemand: featureInterest.providerDemand,
        destinationDemand: featureInterest.destinationDemand,
        conversionOpportunities: featureInterest.conversionOpportunities,
      },
    };
  }
}

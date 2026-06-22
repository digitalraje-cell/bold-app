import { Injectable } from '@nestjs/common';
import { isPaidPlan } from '@boldmeet/shared';
import { MeetingStatus, SubscriptionPlan } from '@prisma/client';
import { RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalUsers,
      freeUsers,
      paidUsers,
      meetingsCreated,
      meetingsRunning,
      totalParticipants,
      revenueAgg,
      registrationStats,
      recentUsers,
      recentMeetings,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { subscriptionPlan: SubscriptionPlan.FREE },
      }),
      this.prisma.user.count({
        where: { subscriptionPlan: { not: SubscriptionPlan.FREE } },
      }),
      this.prisma.meeting.count(),
      this.prisma.meeting.count({ where: { status: MeetingStatus.LIVE } }),
      this.prisma.participant.count({ where: { leftAt: null } }),
      this.prisma.subscriptionPayment.aggregate({
        where: { status: { in: ['paid', 'activated', 'success'] } },
        _sum: { amountInr: true },
      }),
      Promise.all([
        this.prisma.meetingRegistration.count(),
        this.prisma.meetingRegistration.count({
          where: {
            status: {
              in: [RegistrationStatus.APPROVED, RegistrationStatus.JOINED],
            },
          },
        }),
        this.prisma.meetingRegistration.count({
          where: { status: RegistrationStatus.JOINED },
        }),
        this.prisma.meetingSettings.count({
          where: { registrationRequired: true },
        }),
      ]),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          subscriptionPlan: true,
          createdAt: true,
          isActive: true,
        },
      }),
      this.prisma.meeting.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          meetingCode: true,
          title: true,
          hostName: true,
          hostEmail: true,
          status: true,
          createdAt: true,
          _count: { select: { participants: true } },
        },
      }),
    ]);

    const [
      totalRegistrations,
      approvedRegistrations,
      joinedRegistrations,
      meetingsWithRegistration,
    ] = registrationStats;
    const registrationConversionRate =
      totalRegistrations > 0
        ? Math.round((approvedRegistrations / totalRegistrations) * 1000) / 10
        : 0;
    const joinRate =
      approvedRegistrations > 0
        ? Math.round((joinedRegistrations / approvedRegistrations) * 1000) / 10
        : 0;

    return {
      cards: {
        totalUsers,
        freeUsers,
        paidUsers,
        meetingsCreated,
        meetingsRunning,
        totalParticipants,
        revenueInr: revenueAgg._sum.amountInr ?? 0,
        totalRegistrations,
        meetingsWithRegistration,
        registrationConversionRate,
        joinRate,
      },
      recentUsers: recentUsers.map((u) => ({
        ...u,
        isPaid: isPaidPlan(u.subscriptionPlan),
      })),
      recentMeetings: recentMeetings.map((m) => ({
        id: m.id,
        meetingCode: m.meetingCode,
        title: m.title,
        hostName: m.hostName,
        hostEmail: m.hostEmail,
        status: m.status,
        createdAt: m.createdAt,
        participantCount: m._count.participants,
      })),
    };
  }
}

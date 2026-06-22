import { Injectable } from '@nestjs/common';
import { MeetingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminMeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  listMeetings(options?: { status?: MeetingStatus; search?: string }) {
    const where: Prisma.MeetingWhereInput = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { meetingCode: { contains: q, mode: 'insensitive' } },
        { hostName: { contains: q, mode: 'insensitive' } },
        { hostEmail: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.meeting.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        meetingCode: true,
        title: true,
        hostId: true,
        hostName: true,
        hostEmail: true,
        status: true,
        roomMode: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });
  }

  listActiveParticipants() {
    return this.prisma.participant.findMany({
      where: { leftAt: null, status: { in: ['ADMITTED', 'WAITING'] } },
      orderBy: { joinedAt: 'desc' },
      take: 300,
      select: {
        id: true,
        displayName: true,
        role: true,
        status: true,
        joinedAt: true,
        meeting: {
          select: {
            id: true,
            meetingCode: true,
            title: true,
            hostName: true,
            hostEmail: true,
            status: true,
          },
        },
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  listRecordings() {
    return this.prisma.recordingSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        meetingId: true,
        userId: true,
        provider: true,
        status: true,
        watchUrl: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
      },
    });
  }
}

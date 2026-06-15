import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { MeetingStatus, ParticipantRole, ParticipantStatus } from '@prisma/client';
import { generateMeetingCode } from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto, JoinMeetingDto, UpdateMeetingSettingsDto } from './dto/meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(private prisma: PrismaService) {}

  async create(hostId: string, dto: CreateMeetingDto) {
    const meetingCode = generateMeetingCode();
    const isInstant = !dto.scheduledAt;

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const host = await this.prisma.user.findUniqueOrThrow({
      where: { id: hostId },
      select: { name: true, email: true },
    });

    const meeting = await this.prisma.meeting.create({
      data: {
        title: dto.title,
        description: dto.description,
        hostId,
        meetingCode,
        password: passwordHash,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status: isInstant ? MeetingStatus.LIVE : MeetingStatus.SCHEDULED,
        startedAt: isInstant ? new Date() : null,
        jitsiRoom: `boldmeet-${meetingCode}`,
        settings: {
          create: {
            chatEnabled: dto.settings?.chatEnabled ?? true,
            chatMode: dto.settings?.chatMode ?? 'EVERYONE',
            reactionsEnabled: dto.settings?.reactionsEnabled ?? true,
            raiseHandEnabled: dto.settings?.raiseHandEnabled ?? true,
            screenShareEnabled: dto.settings?.screenShareEnabled ?? true,
            screenShareHostOnly: dto.settings?.screenShareHostOnly ?? false,
            waitingRoomEnabled: dto.settings?.waitingRoomEnabled ?? false,
            participantRenameEnabled: dto.settings?.participantRenameEnabled ?? false,
            participantMicAccess: dto.settings?.participantMicAccess ?? true,
            coHostPermissionsEnabled: dto.settings?.coHostPermissionsEnabled ?? true,
            autoMuteParticipants: dto.settings?.autoMuteParticipants ?? false,
          },
        },
      },
      include: { settings: true },
    });

    await this.prisma.participant.create({
      data: {
        meetingId: meeting.id,
        userId: hostId,
        displayName: host.name || host.email,
        role: ParticipantRole.HOST,
        status: ParticipantStatus.ADMITTED,
      },
    });

    const updated = await this.prisma.meeting.findUniqueOrThrow({
      where: { id: meeting.id },
      include: { settings: true, host: { select: { id: true, name: true, email: true } } },
    });

    return this.sanitizeMeeting(updated);
  }

  async findByHost(hostId: string, status?: MeetingStatus) {
    const meetings = await this.prisma.meeting.findMany({
      where: {
        hostId,
        ...(status ? { status } : {}),
      },
      include: {
        settings: true,
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return meetings.map((m) => this.sanitizeMeeting(m));
  }

  async findById(id: string, userId?: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        settings: true,
        host: { select: { id: true, name: true, email: true } },
        _count: { select: { participants: { where: { status: 'ADMITTED' } } } },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const isHost = userId === meeting.hostId;
    return this.sanitizeMeeting(meeting, isHost);
  }

  async findByCode(meetingCode: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { meetingCode: meetingCode.toLowerCase() },
      include: {
        settings: true,
        host: { select: { id: true, name: true } },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return {
      id: meeting.id,
      title: meeting.title,
      hostName: meeting.host.name,
      status: meeting.status,
      hasPassword: !!meeting.password,
      waitingRoomEnabled: meeting.settings?.waitingRoomEnabled ?? false,
    };
  }

  async join(meetingId: string, userId: string | null, dto: JoinMeetingDto) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { settings: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.status === MeetingStatus.ENDED) {
      throw new BadRequestException('This meeting has ended');
    }

    if (meeting.password) {
      if (!dto.password) {
        throw new BadRequestException('Password required');
      }
      const valid = await bcrypt.compare(dto.password, meeting.password);
      if (!valid) {
        throw new ForbiddenException('Invalid password');
      }
    }

    const waitingRoom = meeting.settings?.waitingRoomEnabled ?? false;
    const isHost = userId === meeting.hostId;
    const status = isHost || !waitingRoom ? ParticipantStatus.ADMITTED : ParticipantStatus.WAITING;

    let participant;

    if (userId) {
      participant = await this.prisma.participant.upsert({
        where: {
          meetingId_userId: { meetingId, userId },
        },
        create: {
          meetingId,
          userId,
          displayName: dto.displayName,
          role: isHost ? ParticipantRole.HOST : ParticipantRole.PARTICIPANT,
          status,
          isMuted: !!(meeting.settings?.autoMuteParticipants && !isHost),
        },
        update: {
          displayName: dto.displayName,
          status,
          leftAt: null,
        },
      });
    } else {
      participant = await this.prisma.participant.create({
        data: {
          meetingId,
          displayName: dto.displayName,
          role: ParticipantRole.PARTICIPANT,
          status,
          isMuted: !!(meeting.settings?.autoMuteParticipants),
        },
      });
    }

    if (meeting.status === MeetingStatus.SCHEDULED) {
      await this.prisma.meeting.update({
        where: { id: meetingId },
        data: { status: MeetingStatus.LIVE, startedAt: new Date() },
      });
    }

    return {
      meeting: this.sanitizeMeeting(meeting, isHost),
      participant,
      admitted: participant.status === ParticipantStatus.ADMITTED,
    };
  }

  async updateSettings(meetingId: string, hostId: string, dto: UpdateMeetingSettingsDto) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostId !== hostId) throw new ForbiddenException('Only the host can update settings');

    const settings = await this.prisma.meetingSettings.update({
      where: { meetingId },
      data: dto,
    });

    return settings;
  }

  async endMeeting(meetingId: string, hostId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostId !== hostId) throw new ForbiddenException('Only the host can end the meeting');

    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: { status: MeetingStatus.ENDED, endedAt: new Date() },
    });
  }

  private sanitizeMeeting(meeting: Record<string, unknown>, includeSensitive = false) {
    const { password, ...rest } = meeting;
    return {
      ...rest,
      hasPassword: !!password,
      ...(includeSensitive && password ? { password: undefined } : {}),
    };
  }
}

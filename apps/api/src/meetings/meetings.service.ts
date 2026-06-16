import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { MeetingStatus, ParticipantRole, ParticipantStatus } from '@prisma/client';
import { generateMeetingCode, getWebinarParticipantDefaults, getMeetingParticipantDefaults, isStageVisibleRole } from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../subscriptions/permissions.service';
import { encryptText, decryptText } from '../common/crypto.util';
import { CreateMeetingDto, JoinMeetingDto, UpdateMeetingSettingsDto } from './dto/meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    private prisma: PrismaService,
    private permissionsService: PermissionsService,
  ) {}

  private meetingIdentifierWhere(idOrCode: string) {
    return {
      OR: [{ id: idOrCode }, { meetingCode: idOrCode.toLowerCase() }],
    };
  }

  async create(hostId: string, dto: CreateMeetingDto) {
    const host = await this.prisma.user.findUniqueOrThrow({
      where: { id: hostId },
      select: { name: true, email: true, isVerified: true },
    });

    if (!host.isVerified) {
      throw new ForbiddenException('Verify your account to host meetings');
    }

    const planAttendeeLimit = await this.permissionsService.getAttendeeLimit(hostId);
    const participantLimit = dto.participantLimit
      ? Math.min(dto.participantLimit, planAttendeeLimit)
      : planAttendeeLimit;

    const meetingCode = generateMeetingCode();
    const isInstant = !dto.scheduledAt;

    let passwordHash: string | undefined;
    let passcodeEncrypted: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
      passcodeEncrypted = encryptText(dto.password);
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        title: dto.title,
        description: dto.description,
        hostId,
        meetingCode,
        password: passwordHash,
        passcodeEncrypted,
        participantLimit,
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

    return this.sanitizeMeeting(updated, true);
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

  async findById(idOrCode: string, userId?: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: this.meetingIdentifierWhere(idOrCode),
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

  async getInviteDetails(meetingId: string, hostId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostId !== hostId) throw new ForbiddenException('Only the host can view invite details');

    return {
      id: meeting.id,
      title: meeting.title,
      meetingCode: meeting.meetingCode,
      passcode: meeting.passcodeEncrypted
        ? decryptText(meeting.passcodeEncrypted)
        : null,
      hasPassword: !!meeting.password,
    };
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
      isLocked: meeting.isLocked,
      waitingRoomEnabled: meeting.settings?.waitingRoomEnabled ?? false,
    };
  }

  async join(idOrCode: string, userId: string | null, dto: JoinMeetingDto) {
    const meeting = await this.prisma.meeting.findFirst({
      where: this.meetingIdentifierWhere(idOrCode),
      include: { settings: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const meetingId = meeting.id;

    if (meeting.status === MeetingStatus.ENDED) {
      throw new BadRequestException('This meeting has ended');
    }

    const isHost = userId === meeting.hostId;

    if (meeting.isLocked && !isHost) {
      throw new BadRequestException('This meeting is locked');
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

    const admittedCount = await this.prisma.participant.count({
      where: { meetingId, status: ParticipantStatus.ADMITTED },
    });

    if (!isHost && admittedCount >= meeting.participantLimit) {
      throw new BadRequestException('This meeting has reached its participant limit');
    }

    const waitingRoom = meeting.settings?.waitingRoomEnabled ?? false;
    const status = isHost || !waitingRoom ? ParticipantStatus.ADMITTED : ParticipantStatus.WAITING;

    const role = isHost ? ParticipantRole.HOST : ParticipantRole.PARTICIPANT;
    const modeDefaults =
      meeting.roomMode === 'WEBINAR' && !isStageVisibleRole(role)
        ? getWebinarParticipantDefaults()
        : meeting.roomMode === 'WEBINAR'
          ? getMeetingParticipantDefaults(true)
          : getMeetingParticipantDefaults(meeting.settings?.participantMicAccess ?? true);

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
          role,
          status,
          ...modeDefaults,
          isMuted: modeDefaults.isMuted || !!(meeting.settings?.autoMuteParticipants && !isHost),
        },
        update: {
          displayName: dto.displayName,
          status,
          leftAt: null,
          ...(status === ParticipantStatus.ADMITTED ? modeDefaults : {}),
        },
      });
    } else {
      participant = await this.prisma.participant.create({
        data: {
          meetingId,
          displayName: dto.displayName,
          role: ParticipantRole.PARTICIPANT,
          status,
          ...modeDefaults,
          isMuted: modeDefaults.isMuted || !!meeting.settings?.autoMuteParticipants,
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

  async setLocked(meetingId: string, hostId: string, isLocked: boolean) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostId !== hostId) throw new ForbiddenException('Only the host can lock the meeting');

    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: { isLocked },
    });
  }

  async endMeeting(meetingId: string, hostId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostId !== hostId) throw new ForbiddenException('Only the host can end the meeting');

    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: { status: MeetingStatus.ENDED, endedAt: new Date(), isLocked: true },
    });
  }

  async getDurationStatus(meetingId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: {
        id: true,
        hostId: true,
        startedAt: true,
        status: true,
        durationLimitReachedAt: true,
      },
    });

    if (!meeting || !meeting.startedAt || meeting.status === MeetingStatus.ENDED) {
      return { active: false, status: null };
    }

    const durationStatus = await this.permissionsService.getMeetingDurationStatus(
      meeting.hostId,
      meeting.startedAt,
    );

    if (!durationStatus) {
      return { active: true, status: null, unlimited: true };
    }

    if (durationStatus.isExpired && meeting.status === MeetingStatus.LIVE) {
      await this.prisma.meeting.update({
        where: { id: meetingId },
        data: {
          status: MeetingStatus.ENDED,
          endedAt: new Date(),
          isLocked: true,
          durationLimitReachedAt: meeting.durationLimitReachedAt ?? new Date(),
        },
      });
      return {
        active: false,
        expired: true,
        reason: 'FREE_PLAN_DURATION_LIMIT',
        status: durationStatus,
        message: 'Your free meeting time has ended. Upgrade to continue unlimited meetings.',
      };
    }

    return {
      active: true,
      expired: false,
      status: durationStatus,
      warning: durationStatus.isInGracePeriod,
      message: durationStatus.isInGracePeriod
        ? 'Grace period: meeting will end shortly unless you upgrade.'
        : undefined,
    };
  }

  private sanitizeMeeting(meeting: Record<string, unknown>, includeSensitive = false) {
    const { password, passcodeEncrypted, ...rest } = meeting;
    return {
      ...rest,
      hasPassword: !!password,
      passcode:
        includeSensitive && typeof passcodeEncrypted === 'string'
          ? decryptText(passcodeEncrypted)
          : undefined,
    };
  }
}

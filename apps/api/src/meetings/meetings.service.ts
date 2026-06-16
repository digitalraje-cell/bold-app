import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { Meeting, MeetingStatus, ParticipantRole, ParticipantStatus, Prisma } from '@prisma/client';
import { generateMeetingCode, normalizeMeetingCode, getWebinarParticipantDefaults, getMeetingParticipantDefaults, isStageVisibleRole } from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../subscriptions/permissions.service';
import { MeetingGateway } from '../gateway/meeting.gateway';
import { encryptText, decryptText } from '../common/crypto.util';
import { CreateMeetingDto, JoinMeetingDto, RegisterMeetingDto, UpdateMeetingSettingsDto } from './dto/meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    private prisma: PrismaService,
    private permissionsService: PermissionsService,
    private gateway: MeetingGateway,
  ) {}

  private meetingIdentifierWhere(idOrCode: string) {
    const normalized = normalizeMeetingCode(idOrCode);
    return {
      OR: [{ id: idOrCode }, { meetingCode: normalized }, { id: normalized }],
    };
  }

  private async generateUniqueMeetingCode(maxAttempts = 12): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const meetingCode = generateMeetingCode();
      const existing = await this.prisma.meeting.findUnique({
        where: { meetingCode },
        select: { id: true },
      });
      if (!existing) return meetingCode;
    }
    throw new BadRequestException('Could not generate a unique meeting ID. Please try again.');
  }

  private async resolveMeeting<T extends Prisma.MeetingInclude | undefined>(
    idOrCode: string,
    include?: T,
  ): Promise<
    T extends Prisma.MeetingInclude
      ? Prisma.MeetingGetPayload<{ include: T }>
      : Meeting
  > {
    console.log('[meeting] join lookup', { idOrCode });

    const meeting = await this.prisma.meeting.findFirst({
      where: this.meetingIdentifierWhere(idOrCode),
      include,
    });

    if (!meeting) {
      console.error('[meeting] not found', { idOrCode });
      throw new NotFoundException('Meeting not found or no longer available');
    }

    console.log('[meeting] found', {
      id: meeting.id,
      meetingCode: meeting.meetingCode,
    });

    return meeting as T extends Prisma.MeetingInclude
      ? Prisma.MeetingGetPayload<{ include: T }>
      : Meeting;
  }

  async create(hostId: string, dto: CreateMeetingDto) {
    const title = dto.title?.trim();
    if (!title) {
      throw new BadRequestException('Meeting title is required');
    }

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

    const meetingCode = await this.generateUniqueMeetingCode();
    const isInstant = !dto.scheduledAt;

    let scheduledEndAt: Date | null = null;
    if (dto.scheduledAt && dto.durationMinutes) {
      scheduledEndAt = new Date(new Date(dto.scheduledAt).getTime() + dto.durationMinutes * 60_000);
    }

    let passwordHash: string | undefined;
    let passcodeEncrypted: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
      passcodeEncrypted = encryptText(dto.password);
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        title,
        description: dto.description?.trim() || undefined,
        hostId,
        meetingCode,
        password: passwordHash,
        passcodeEncrypted,
        participantLimit,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        scheduledEndAt,
        durationMinutes: dto.durationMinutes ?? null,
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
            registrationRequired: dto.settings?.registrationRequired ?? false,
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

    console.log('[meeting] created', {
      id: updated.id,
      meetingCode: updated.meetingCode,
      hostId: updated.hostId,
      status: updated.status,
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

  async findPublic(idOrCode: string) {
    console.log('[meeting] public preview lookup', { idOrCode });
    const meeting = await this.resolveMeeting(idOrCode, {
      host: { select: { name: true, email: true } },
      settings: true,
      _count: {
        select: {
          participants: { where: { status: ParticipantStatus.ADMITTED } },
        },
      },
    });

    console.log('[meeting] public preview found', {
      id: meeting.id,
      meetingCode: meeting.meetingCode,
      status: meeting.status,
      participantCount: meeting._count.participants,
    });

    return {
      id: meeting.id,
      title: meeting.title,
      meetingCode: meeting.meetingCode,
      hostId: meeting.hostId,
      jitsiRoom: meeting.jitsiRoom,
      hostName: meeting.host.name || meeting.host.email || 'Unknown host',
      status: this.getEffectiveStatus(meeting),
      startedAt: meeting.startedAt,
      scheduledAt: meeting.scheduledAt,
      scheduledEndAt: meeting.scheduledEndAt,
      durationMinutes: meeting.durationMinutes,
      participantCount: meeting._count.participants,
      hasPassword: !!meeting.password,
      registrationRequired: meeting.settings?.registrationRequired ?? false,
      endedAt: meeting.endedAt,
    };
  }

  private getEffectiveStatus(
    meeting: Pick<Meeting, 'status' | 'scheduledAt' | 'scheduledEndAt' | 'startedAt'>,
  ): MeetingStatus {
    if (meeting.status === MeetingStatus.ENDED) return MeetingStatus.ENDED;
    const now = Date.now();
    if (meeting.scheduledEndAt && now > meeting.scheduledEndAt.getTime()) {
      return MeetingStatus.ENDED;
    }
    if (
      meeting.status === MeetingStatus.SCHEDULED &&
      meeting.scheduledAt &&
      now < meeting.scheduledAt.getTime()
    ) {
      return MeetingStatus.SCHEDULED;
    }
    if (meeting.status === MeetingStatus.SCHEDULED && meeting.scheduledAt && now >= meeting.scheduledAt.getTime()) {
      return MeetingStatus.LIVE;
    }
    return meeting.status;
  }

  async findById(idOrCode: string, userId?: string) {
    const meeting = await this.resolveMeeting(idOrCode, {
      settings: true,
      host: { select: { id: true, name: true, email: true } },
      _count: { select: { participants: { where: { status: 'ADMITTED' } } } },
    });

    const isHost = userId === meeting.hostId;
    return this.sanitizeMeeting(meeting, isHost);
  }

  async getInviteDetails(idOrCode: string, hostId: string) {
    const meeting = await this.resolveMeeting(idOrCode);
    if (meeting.hostId !== hostId) {
      throw new ForbiddenException('Only the host can view invite details');
    }

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
      where: { meetingCode: normalizeMeetingCode(meetingCode) },
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
    console.log('[meeting] join lookup start', { idOrCode, userId });

    const meeting = await this.resolveMeeting(idOrCode, { settings: true });

    console.log('[meeting] join lookup result', {
      id: meeting.id,
      meetingCode: meeting.meetingCode,
      status: meeting.status,
      isLocked: meeting.isLocked,
      hostId: meeting.hostId,
    });

    const meetingId = meeting.id;

    const isHost = userId === meeting.hostId;

    if (meeting.isLocked && !isHost) {
      throw new BadRequestException('This meeting is locked');
    }

    const effectiveStatus = this.getEffectiveStatus(meeting);
    if (effectiveStatus === MeetingStatus.ENDED) {
      throw new BadRequestException('This meeting has ended');
    }

    if (
      meeting.status === MeetingStatus.SCHEDULED &&
      meeting.scheduledAt &&
      Date.now() < meeting.scheduledAt.getTime() &&
      !isHost
    ) {
      throw new BadRequestException('This meeting has not started yet');
    }

    if (meeting.settings?.registrationRequired && !isHost) {
      let email = dto.registrantEmail?.trim().toLowerCase();
      if (!email && userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        email = user?.email?.toLowerCase();
      }
      if (!email) {
        throw new BadRequestException('Registration is required before joining');
      }
      const registered = await this.prisma.meetingRegistrant.findFirst({
        where: { meetingId, email: { equals: email, mode: 'insensitive' } },
      });
      if (!registered) {
        throw new ForbiddenException('Email is not registered for this meeting');
      }
    }

    const skipPassword = isHost || dto.viaDirectLink === true || !!userId;
    if (meeting.password && !skipPassword) {
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
    } else if (dto.participantId) {
      const existing = await this.prisma.participant.findFirst({
        where: {
          id: dto.participantId,
          meetingId,
          userId: null,
        },
      });
      if (existing) {
        participant = await this.prisma.participant.update({
          where: { id: existing.id },
          data: {
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

    console.log('[meeting] join success', {
      meetingId,
      participantId: participant.id,
      status: participant.status,
      admitted: participant.status === ParticipantStatus.ADMITTED,
      userId,
    });

    if (participant.status === ParticipantStatus.ADMITTED) {
      this.gateway.broadcastParticipantJoined(meetingId, {
        id: participant.id,
        displayName: participant.displayName,
        role: participant.role,
        userId: participant.userId,
        isMuted: participant.isMuted,
        isVideoOff: participant.isVideoOff,
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

    this.gateway.broadcastSettingsUpdate(meetingId, dto as Record<string, unknown>);

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

  async endMeeting(idOrCode: string, hostId: string) {
    const meeting = await this.resolveMeeting(idOrCode);
    if (meeting.hostId !== hostId) {
      throw new ForbiddenException('Only the host can end the meeting');
    }
    if (meeting.status === MeetingStatus.ENDED) {
      return meeting;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.participant.updateMany({
        where: {
          meetingId: meeting.id,
          status: { in: [ParticipantStatus.ADMITTED, ParticipantStatus.WAITING] },
        },
        data: { status: ParticipantStatus.LEFT, leftAt: new Date() },
      });

      return tx.meeting.update({
        where: { id: meeting.id },
        data: { status: MeetingStatus.ENDED, endedAt: new Date(), isLocked: true },
      });
    });

    this.gateway.broadcastMeetingEnded(meeting.id, 'Meeting ended by host');

    return updated;
  }

  async leaveMeeting(idOrCode: string, userId: string) {
    const meeting = await this.resolveMeeting(idOrCode);

    if (meeting.status === MeetingStatus.ENDED) {
      return { success: true };
    }

    const participant = await this.prisma.participant.findFirst({
      where: {
        meetingId: meeting.id,
        userId,
        status: { in: [ParticipantStatus.ADMITTED, ParticipantStatus.WAITING] },
      },
    });

    if (!participant) {
      throw new NotFoundException('You are not in this meeting');
    }

    await this.prisma.participant.update({
      where: { id: participant.id },
      data: { status: ParticipantStatus.LEFT, leftAt: new Date() },
    });

    this.gateway.broadcastParticipantLeft(meeting.id, participant.id);

    return { success: true };
  }

  async leaveGuest(idOrCode: string, participantId: string) {
    const meeting = await this.resolveMeeting(idOrCode);

    if (meeting.status === MeetingStatus.ENDED) {
      return { success: true };
    }

    const participant = await this.prisma.participant.findFirst({
      where: {
        id: participantId,
        meetingId: meeting.id,
        status: { in: [ParticipantStatus.ADMITTED, ParticipantStatus.WAITING] },
      },
    });

    if (!participant) {
      return { success: true };
    }

    await this.prisma.participant.update({
      where: { id: participant.id },
      data: { status: ParticipantStatus.LEFT, leftAt: new Date() },
    });

    this.gateway.broadcastParticipantLeft(meeting.id, participant.id);

    return { success: true };
  }

  async registerForMeeting(idOrCode: string, dto: RegisterMeetingDto) {
    const meeting = await this.resolveMeeting(idOrCode, { settings: true });

    if (!meeting.settings?.registrationRequired) {
      throw new BadRequestException('Registration is not required for this meeting');
    }

    if (this.getEffectiveStatus(meeting) === MeetingStatus.ENDED) {
      throw new BadRequestException('This meeting has ended');
    }

    const email = dto.email.trim().toLowerCase();

    return this.prisma.meetingRegistrant.upsert({
      where: {
        meetingId_email: { meetingId: meeting.id, email },
      },
      create: {
        meetingId: meeting.id,
        fullName: dto.fullName.trim(),
        email,
        phone: dto.phone?.trim() || null,
        company: dto.company?.trim() || null,
        designation: dto.designation?.trim() || null,
      },
      update: {
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim() || null,
        company: dto.company?.trim() || null,
        designation: dto.designation?.trim() || null,
      },
    });
  }

  async listRegistrants(idOrCode: string, hostId: string) {
    const meeting = await this.resolveMeeting(idOrCode);
    if (meeting.hostId !== hostId) {
      throw new ForbiddenException('Only the host can view registrants');
    }

    return this.prisma.meetingRegistrant.findMany({
      where: { meetingId: meeting.id },
      orderBy: { createdAt: 'desc' },
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

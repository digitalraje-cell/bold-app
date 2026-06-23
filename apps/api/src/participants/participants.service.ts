import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ParticipantRole, ParticipantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../subscriptions/permissions.service';
import { MeetingGateway } from '../gateway/meeting.gateway';

@Injectable()
export class ParticipantsService {
  constructor(
    private prisma: PrismaService,
    private permissionsService: PermissionsService,
    private gateway: MeetingGateway,
  ) {}

  async list(meetingId: string) {
    return this.prisma.participant.findMany({
      where: { meetingId, status: { not: ParticipantStatus.REMOVED } },
      include: {
        user: {
          select: { id: true, name: true, email: true, isVerified: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async canModerate(meetingId: string, userId: string): Promise<boolean> {
    const participant = await this.prisma.participant.findFirst({
      where: { meetingId, userId, status: ParticipantStatus.ADMITTED },
      include: { meeting: { include: { settings: true } } },
    });

    if (!participant) return false;
    if (participant.role === ParticipantRole.HOST) return true;
    if (
      participant.role === ParticipantRole.CO_HOST &&
      participant.meeting.settings?.coHostPermissionsEnabled
    ) {
      return true;
    }
    return false;
  }

  async setMuted(
    meetingId: string,
    participantId: string,
    actorId: string,
    isMuted: boolean,
  ) {
    await this.ensureParticipant(meetingId, participantId);
    const updated = await this.prisma.participant.update({
      where: { id: participantId },
      data: { isMuted },
    });
    this.gateway.broadcastParticipantUpdate(meetingId, participantId, {
      isMuted,
    });
    return updated;
  }

  async setMediaState(
    meetingId: string,
    participantId: string,
    patch: { isMuted?: boolean; isVideoOff?: boolean },
  ) {
    const participant = await this.ensureParticipant(meetingId, participantId);
    const data: { isMuted?: boolean; isVideoOff?: boolean } = {};
    if (typeof patch.isMuted === 'boolean') data.isMuted = patch.isMuted;
    if (typeof patch.isVideoOff === 'boolean')
      data.isVideoOff = patch.isVideoOff;
    if (Object.keys(data).length === 0) return participant;

    const updated = await this.prisma.participant.update({
      where: { id: participantId },
      data,
    });
    this.gateway.broadcastParticipantUpdate(meetingId, participantId, data);
    return updated;
  }

  async remove(meetingId: string, participantId: string, actorId: string) {
    await this.ensureParticipant(meetingId, participantId);
    const updated = await this.prisma.participant.update({
      where: { id: participantId },
      data: { status: ParticipantStatus.REMOVED, leftAt: new Date() },
    });
    this.gateway.broadcastParticipantLeft(meetingId, participantId);
    return updated;
  }

  async assertHost(meetingId: string, actorId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting || meeting.hostId !== actorId) {
      throw new ForbiddenException('Only the host can manage roles');
    }
  }

  async updateRole(
    meetingId: string,
    participantId: string,
    actorId: string,
    role: ParticipantRole,
  ) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting || meeting.hostId !== actorId) {
      throw new ForbiddenException('Only the host can change roles');
    }

    const target = await this.ensureParticipant(meetingId, participantId);
    if (target.role === ParticipantRole.HOST) {
      throw new ForbiddenException('Cannot change the host role');
    }
    if (
      role === ParticipantRole.CO_HOST &&
      target.role !== ParticipantRole.PARTICIPANT
    ) {
      throw new ForbiddenException(
        'Only participants can be promoted to co-host',
      );
    }
    if (
      role === ParticipantRole.PARTICIPANT &&
      target.role !== ParticipantRole.CO_HOST
    ) {
      throw new ForbiddenException('Only co-hosts can be demoted');
    }

    if (role === ParticipantRole.CO_HOST) {
      await this.permissionsService.check(meeting.hostId, 'canUseCohost');
      const maxCohosts = await this.permissionsService.getMaxCohosts(
        meeting.hostId,
      );
      const currentCohosts = await this.prisma.participant.count({
        where: {
          meetingId,
          role: ParticipantRole.CO_HOST,
          status: ParticipantStatus.ADMITTED,
        },
      });
      if (currentCohosts >= maxCohosts) {
        throw new ForbiddenException(
          `Your plan allows a maximum of ${maxCohosts} co-host(s)`,
        );
      }
    }

    if (role === ParticipantRole.PANELIST) {
      throw new ForbiddenException(
        'Panelist role is deprecated — use stage controls in webinar mode',
      );
    }

    const updated = await this.prisma.participant.update({
      where: { id: participantId },
      data: { role },
    });
    this.gateway.broadcastParticipantRoleChanged(
      meetingId,
      participantId,
      role,
    );
    return updated;
  }

  async transferHost(
    meetingId: string,
    participantId: string,
    actorId: string,
  ) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting || meeting.hostId !== actorId) {
      throw new ForbiddenException('Only the host can transfer host role');
    }

    const target = await this.ensureParticipant(meetingId, participantId);
    if (!target.userId) {
      throw new ForbiddenException('Host can only be transferred to signed-in participants');
    }
    if (target.userId === actorId) {
      throw new ForbiddenException('This participant is already the host');
    }

    const previousHost = await this.prisma.participant.findFirst({
      where: { meetingId, userId: actorId, status: ParticipantStatus.ADMITTED },
    });

    await this.prisma.$transaction([
      this.prisma.participant.updateMany({
        where: { meetingId, userId: actorId },
        data: { role: ParticipantRole.PARTICIPANT },
      }),
      this.prisma.participant.update({
        where: { id: participantId },
        data: { role: ParticipantRole.HOST },
      }),
      this.prisma.meeting.update({
        where: { id: meetingId },
        data: { hostId: target.userId },
      }),
    ]);

    if (previousHost) {
      this.gateway.broadcastParticipantRoleChanged(
        meetingId,
        previousHost.id,
        ParticipantRole.PARTICIPANT,
      );
    }
    this.gateway.broadcastParticipantRoleChanged(
      meetingId,
      participantId,
      ParticipantRole.HOST,
    );

    return { success: true, hostId: target.userId };
  }

  async admitFromWaitingRoom(
    meetingId: string,
    participantId: string,
    actorId: string,
  ) {
    await this.ensureParticipant(meetingId, participantId);
    const updated = await this.prisma.participant.update({
      where: { id: participantId },
      data: { status: ParticipantStatus.ADMITTED },
    });
    this.gateway.broadcastWaitingAdmit(meetingId, participantId);
    this.gateway.broadcastParticipantJoined(meetingId, {
      id: updated.id,
      displayName: updated.displayName,
      role: updated.role,
      userId: updated.userId,
      isMuted: updated.isMuted,
      isVideoOff: updated.isVideoOff,
    });
    return updated;
  }

  private async ensureParticipant(meetingId: string, participantId: string) {
    const participant = await this.prisma.participant.findFirst({
      where: { id: participantId, meetingId },
    });
    if (!participant) throw new NotFoundException('Participant not found');
    return participant;
  }
}

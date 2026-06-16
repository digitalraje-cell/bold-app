import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ParticipantRole,
  ParticipantStatus,
  RoomMode,
  ChatMode,
} from '@prisma/client';
import {
  RoomMode as SharedRoomMode,
  getWebinarParticipantDefaults,
  getMeetingParticipantDefaults,
  getStageParticipantState,
  isStageVisibleRole,
} from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../subscriptions/permissions.service';
import { ParticipantsService } from '../participants/participants.service';
import { MeetingGateway } from '../gateway/meeting.gateway';

@Injectable()
export class RoomService {
  constructor(
    private prisma: PrismaService,
    private permissionsService: PermissionsService,
    private participantsService: ParticipantsService,
    private gateway: MeetingGateway,
  ) {}

  async getRoomState(meetingId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        settings: true,
        participants: {
          where: { status: ParticipantStatus.ADMITTED },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async switchRoomMode(meetingId: string, actorId: string, mode: RoomMode) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { settings: true },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostId !== actorId) {
      throw new ForbiddenException('Only the host can switch room mode');
    }

    await this.permissionsService.check(meeting.hostId, 'canSwitchRoomMode');

    const updated = await this.prisma.meeting.update({
      where: { id: meetingId },
      data: { roomMode: mode },
    });

    const participants = await this.prisma.participant.findMany({
      where: { meetingId, status: ParticipantStatus.ADMITTED },
    });

    const stageUpdates = [];

    for (const p of participants) {
      const data = this.buildModeDefaults(p.role, mode, meeting.settings?.participantMicAccess ?? true);
      const updatedParticipant = await this.prisma.participant.update({
        where: { id: p.id },
        data,
      });
      stageUpdates.push(updatedParticipant);
    }

    this.gateway.broadcastRoomModeChanged(meetingId, mode);
    for (const p of stageUpdates) {
      this.gateway.broadcastParticipantStage(meetingId, p);
    }

    return { roomMode: updated.roomMode, participants: stageUpdates };
  }

  async promoteToPanelist(meetingId: string, participantId: string, actorId: string) {
    await this.ensureHost(meetingId, actorId);
    const meeting = await this.prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
    await this.permissionsService.check(meeting.hostId, 'canUsePanelists');

    const participant = await this.prisma.participant.findFirst({
      where: { id: participantId, meetingId },
    });
    if (!participant) throw new NotFoundException('Participant not found');

    const data =
      meeting.roomMode === RoomMode.WEBINAR
        ? {
            role: ParticipantRole.PANELIST,
            ...getStageParticipantState(true, true),
          }
        : { role: ParticipantRole.PANELIST, isOnStage: true };

    const updated = await this.prisma.participant.update({
      where: { id: participantId },
      data,
    });

    this.gateway.broadcastParticipantStage(meetingId, updated);
    return updated;
  }

  async bringOnStage(
    meetingId: string,
    participantId: string,
    actorId: string,
    options: { micAllowed?: boolean; cameraAllowed?: boolean } = {},
  ) {
    const canModerate = await this.participantsService.canModerate(meetingId, actorId);
    if (!canModerate) throw new ForbiddenException('Insufficient permissions');

    const meeting = await this.prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
    if (meeting.roomMode !== RoomMode.WEBINAR) {
      throw new BadRequestException('Stage controls are only available in webinar mode');
    }

    const micAllowed = options.micAllowed ?? true;
    const cameraAllowed = options.cameraAllowed ?? true;

    const updated = await this.prisma.participant.update({
      where: { id: participantId },
      data: getStageParticipantState(micAllowed, cameraAllowed),
    });

    this.gateway.broadcastParticipantStage(meetingId, updated);
    return updated;
  }

  async removeFromStage(meetingId: string, participantId: string, actorId: string) {
    const canModerate = await this.participantsService.canModerate(meetingId, actorId);
    if (!canModerate) throw new ForbiddenException('Insufficient permissions');

    const meeting = await this.prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
    if (meeting.roomMode !== RoomMode.WEBINAR) {
      throw new BadRequestException('Stage controls are only available in webinar mode');
    }

    const participant = await this.prisma.participant.findFirstOrThrow({
      where: { id: participantId, meetingId },
    });

    if (isStageVisibleRole(participant.role)) {
      throw new BadRequestException('Host, co-host, and panelists cannot be removed from stage');
    }

    const updated = await this.prisma.participant.update({
      where: { id: participantId },
      data: getWebinarParticipantDefaults(),
    });

    this.gateway.broadcastParticipantStage(meetingId, updated);
    return updated;
  }

  async setMediaPermissions(
    meetingId: string,
    participantId: string,
    actorId: string,
    micAllowed?: boolean,
    cameraAllowed?: boolean,
  ) {
    const canModerate = await this.participantsService.canModerate(meetingId, actorId);
    if (!canModerate) throw new ForbiddenException('Insufficient permissions');

    const data: Record<string, boolean> = {};
    if (micAllowed !== undefined) {
      data.micAllowed = micAllowed;
      if (!micAllowed) data.isMuted = true;
    }
    if (cameraAllowed !== undefined) {
      data.cameraAllowed = cameraAllowed;
      if (!cameraAllowed) data.isVideoOff = true;
    }

    const updated = await this.prisma.participant.update({
      where: { id: participantId },
      data,
    });

    this.gateway.broadcastParticipantStage(meetingId, updated);
    return updated;
  }

  async updateChatMode(
    meetingId: string,
    actorId: string,
    chatMode: ChatMode,
    chatEnabled?: boolean,
  ) {
    await this.ensureHost(meetingId, actorId);

    const settings = await this.prisma.meetingSettings.update({
      where: { meetingId },
      data: {
        chatMode,
        ...(chatEnabled !== undefined ? { chatEnabled } : {}),
      },
    });

    this.gateway.broadcastChatModeChanged(meetingId, settings.chatMode, settings.chatEnabled);
    return settings;
  }

  private buildModeDefaults(
    role: ParticipantRole,
    mode: RoomMode,
    participantMicAccess: boolean,
  ) {
    if (mode === RoomMode.WEBINAR) {
      if (isStageVisibleRole(role)) {
        return getStageParticipantState(true, true);
      }
      return getWebinarParticipantDefaults();
    }
    return getMeetingParticipantDefaults(participantMicAccess);
  }

  private async ensureHost(meetingId: string, actorId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting || meeting.hostId !== actorId) {
      throw new ForbiddenException('Only the host can perform this action');
    }
  }
}

export { SharedRoomMode };

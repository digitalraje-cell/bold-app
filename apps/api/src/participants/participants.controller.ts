import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ParticipantRole } from '@prisma/client';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { ParticipantsService } from './participants.service';

@Controller('meetings/:meetingId/participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get()
  @UseGuards(AuthGuard)
  list(@Param('meetingId') meetingId: string) {
    return this.participantsService.list(meetingId);
  }

  @Patch(':participantId/mute')
  @UseGuards(AuthGuard)
  mute(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Param('participantId') participantId: string,
    @Body() body: { isMuted: boolean },
  ) {
    return this.moderate(req.user.id, meetingId, () =>
      this.participantsService.setMuted(meetingId, participantId, req.user.id, body.isMuted),
    );
  }

  @Post(':participantId/remove')
  @UseGuards(AuthGuard)
  remove(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.moderate(req.user.id, meetingId, () =>
      this.participantsService.remove(meetingId, participantId, req.user.id),
    );
  }

  @Post(':participantId/make-cohost')
  @UseGuards(AuthGuard)
  makeCoHost(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.moderate(req.user.id, meetingId, () =>
      this.participantsService.updateRole(
        meetingId,
        participantId,
        req.user.id,
        ParticipantRole.CO_HOST,
      ),
    );
  }

  @Post(':participantId/transfer-host')
  @UseGuards(AuthGuard)
  transferHost(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.participantsService.transferHost(meetingId, participantId, req.user.id);
  }

  @Post('waiting/:participantId/admit')
  @UseGuards(AuthGuard)
  admitWaiting(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.moderate(req.user.id, meetingId, () =>
      this.participantsService.admitFromWaitingRoom(meetingId, participantId, req.user.id),
    );
  }

  private async moderate(userId: string, meetingId: string, action: () => Promise<unknown>) {
    const canModerate = await this.participantsService.canModerate(meetingId, userId);
    if (!canModerate) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return action();
  }
}

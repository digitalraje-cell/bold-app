import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { RoomMode, ChatMode } from '@prisma/client';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { RoomService } from './room.service';

@Controller('meetings/:meetingId/room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  getState(@Param('meetingId') meetingId: string) {
    return this.roomService.getRoomState(meetingId);
  }

  @Patch('mode')
  @UseGuards(AuthGuard)
  switchMode(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Body() body: { roomMode: RoomMode },
  ) {
    return this.roomService.switchRoomMode(
      meetingId,
      req.user.id,
      body.roomMode,
    );
  }

  @Patch('chat-mode')
  @UseGuards(AuthGuard)
  updateChatMode(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Body() body: { chatMode: ChatMode; chatEnabled?: boolean },
  ) {
    return this.roomService.updateChatMode(
      meetingId,
      req.user.id,
      body.chatMode,
      body.chatEnabled,
    );
  }

  @Post('participants/:participantId/panelist')
  @UseGuards(AuthGuard)
  promotePanelist(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.roomService.promoteToPanelist(
      meetingId,
      participantId,
      req.user.id,
    );
  }

  @Post('participants/:participantId/stage')
  @UseGuards(AuthGuard)
  bringOnStage(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Param('participantId') participantId: string,
    @Body() body: { micAllowed?: boolean; cameraAllowed?: boolean },
  ) {
    return this.roomService.bringOnStage(
      meetingId,
      participantId,
      req.user.id,
      body,
    );
  }

  @Post('participants/:participantId/stage/remove')
  @UseGuards(AuthGuard)
  removeFromStage(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.roomService.removeFromStage(
      meetingId,
      participantId,
      req.user.id,
    );
  }

  @Patch('participants/:participantId/media')
  @UseGuards(AuthGuard)
  setMediaPermissions(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Param('participantId') participantId: string,
    @Body() body: { micAllowed?: boolean; cameraAllowed?: boolean },
  ) {
    return this.roomService.setMediaPermissions(
      meetingId,
      participantId,
      req.user.id,
      body.micAllowed,
      body.cameraAllowed,
    );
  }
}

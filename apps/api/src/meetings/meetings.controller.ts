import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { MeetingStatus } from '@prisma/client';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { VerifiedGuard } from '../auth/verified.guard';
import { MeetingsService } from './meetings.service';
import {
  CreateMeetingDto,
  JoinByCodeDto,
  JoinMeetingDto,
  LeaveGuestDto,
  RegisterMeetingDto,
  UpdateMeetingSettingsDto,
  JitsiTokenDto,
} from './dto/meeting.dto';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @UseGuards(AuthGuard, VerifiedGuard)
  create(
    @Req() req: Request & { user: AuthUser },
    @Body() dto: CreateMeetingDto,
  ) {
    return this.meetingsService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(
    @Req() req: Request & { user: AuthUser },
    @Query('status') status?: MeetingStatus,
  ) {
    return this.meetingsService.findByHost(req.user.id, status);
  }

  @Get('code/:meetingCode')
  findByCode(@Param('meetingCode') meetingCode: string) {
    return this.meetingsService.findByCode(meetingCode);
  }

  @Get(':id/public')
  findPublic(@Param('id') id: string) {
    return this.meetingsService.findPublic(id);
  }

  @Get(':id/duration')
  getDurationStatus(@Param('id') id: string) {
    return this.meetingsService.getDurationStatus(id);
  }

  @Get(':id/invite')
  @UseGuards(AuthGuard)
  getInvite(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.meetingsService.getInviteDetails(id, req.user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.meetingsService.findById(id, req.user.id);
  }

  @Post('join-by-code')
  @UseGuards(OptionalAuthGuard)
  async joinByCode(
    @Body() dto: JoinByCodeDto,
    @Req() req: Request & { user?: AuthUser },
  ) {
    const meeting = await this.meetingsService.findByCode(dto.meetingCode);
    return this.meetingsService.join(meeting.id, req.user?.id ?? null, {
      displayName: dto.displayName,
      password: dto.password,
      viaDirectLink: false,
    });
  }

  @Post(':id/register')
  register(@Param('id') id: string, @Body() dto: RegisterMeetingDto) {
    return this.meetingsService.registerForMeeting(id, dto);
  }

  @Get(':id/registrants')
  @UseGuards(AuthGuard)
  listRegistrants(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.meetingsService.listRegistrants(id, req.user.id);
  }

  @Post(':id/jitsi-token')
  @UseGuards(OptionalAuthGuard)
  issueJitsiToken(
    @Param('id') id: string,
    @Body() dto: JitsiTokenDto,
    @Req() req: Request & { user?: AuthUser },
  ) {
    return this.meetingsService.issueJitsiToken(id, req.user?.id ?? null, dto);
  }

  @Post(':id/join')
  @UseGuards(OptionalAuthGuard)
  join(
    @Param('id') id: string,
    @Body() dto: JoinMeetingDto,
    @Req() req: Request & { user?: AuthUser },
  ) {
    console.log('[meeting] join request', {
      idOrCode: id,
      displayName: dto.displayName,
      hasPassword: Boolean(dto.password),
      userId: req.user?.id ?? null,
    });
    return this.meetingsService.join(id, req.user?.id ?? null, dto);
  }

  @Patch(':id/settings')
  @UseGuards(AuthGuard)
  updateSettings(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: UpdateMeetingSettingsDto,
  ) {
    return this.meetingsService.updateSettings(id, req.user.id, dto);
  }

  @Post(':id/lock')
  @UseGuards(AuthGuard)
  lockMeeting(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() body: { isLocked: boolean },
  ) {
    return this.meetingsService.setLocked(id, req.user.id, body.isLocked);
  }

  @Post(':id/end')
  @UseGuards(AuthGuard)
  endMeeting(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.meetingsService.endMeeting(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, VerifiedGuard)
  permanentlyDeleteMeeting(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.meetingsService.permanentlyDeleteMeeting(id, req.user.id);
  }

  @Post(':id/leave')
  @UseGuards(AuthGuard)
  leaveMeeting(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.meetingsService.leaveMeeting(id, req.user.id);
  }

  @Post(':id/leave-guest')
  leaveGuest(@Param('id') id: string, @Body() dto: LeaveGuestDto) {
    return this.meetingsService.leaveGuest(id, dto.participantId);
  }
}

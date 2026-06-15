import {
  Body,
  Controller,
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
import { MeetingsService } from './meetings.service';
import {
  CreateMeetingDto,
  JoinByCodeDto,
  JoinMeetingDto,
  UpdateMeetingSettingsDto,
} from './dto/meeting.dto';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: Request & { user: AuthUser }, @Body() dto: CreateMeetingDto) {
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

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.meetingsService.findById(id, req.user.id);
  }

  @Post(':id/join')
  join(
    @Param('id') id: string,
    @Body() dto: JoinMeetingDto,
    @Req() req: Request & { user?: AuthUser },
  ) {
    return this.meetingsService.join(id, req.user?.id ?? null, dto);
  }

  @Post('join-by-code')
  async joinByCode(@Body() dto: JoinByCodeDto, @Req() req: Request & { user?: AuthUser }) {
    const meeting = await this.meetingsService.findByCode(dto.meetingCode);
    return this.meetingsService.join(meeting.id, req.user?.id ?? null, {
      displayName: dto.displayName,
      password: dto.password,
    });
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

  @Post(':id/end')
  @UseGuards(AuthGuard)
  endMeeting(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.meetingsService.endMeeting(id, req.user.id);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MeetingStatus } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminMeetingsService } from './admin-meetings.service';

@Controller('admin/meetings')
@UseGuards(AuthGuard, AdminGuard)
export class AdminMeetingsController {
  constructor(private readonly adminMeetingsService: AdminMeetingsService) {}

  @Get()
  listMeetings(
    @Query('status') status?: MeetingStatus,
    @Query('search') search?: string,
  ) {
    return this.adminMeetingsService.listMeetings({ status, search });
  }

  @Get('participants/active')
  listActiveParticipants() {
    return this.adminMeetingsService.listActiveParticipants();
  }

  @Get('recordings')
  listRecordings() {
    return this.adminMeetingsService.listRecordings();
  }
}

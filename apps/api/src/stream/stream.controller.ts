import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { StreamService } from './stream.service';
import { StartStreamDto } from './dto/start-stream.dto';

@Controller('meetings/:meetingId/stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get()
  @UseGuards(AuthGuard)
  getStream(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
  ) {
    return this.streamService.getForModerator(meetingId, req.user.id);
  }

  @Get('public')
  getPublicStream(@Param('meetingId') meetingId: string) {
    return this.streamService.getPublic(meetingId);
  }

  @Post('start')
  @UseGuards(AuthGuard)
  startStream(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
    @Body() dto: StartStreamDto,
  ) {
    return this.streamService.start(meetingId, req.user.id, dto);
  }

  @Post('stop')
  @UseGuards(AuthGuard)
  stopStream(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
  ) {
    return this.streamService.stop(meetingId, req.user.id);
  }

  @Post('resume')
  @UseGuards(AuthGuard)
  resumeStream(
    @Req() req: Request & { user: AuthUser },
    @Param('meetingId') meetingId: string,
  ) {
    return this.streamService.resume(meetingId, req.user.id);
  }
}

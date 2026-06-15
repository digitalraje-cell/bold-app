import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { VerifiedGuard } from '../auth/verified.guard';
import { YoutubeService } from './youtube.service';

@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('status')
  @UseGuards(AuthGuard, VerifiedGuard)
  status(@Req() _req: Request & { user: AuthUser }) {
    return this.youtubeService.getConnectionStatus();
  }
}

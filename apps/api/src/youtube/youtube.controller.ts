import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { VerifiedGuard } from '../auth/verified.guard';
import { PermissionsGuard } from '../subscriptions/permissions.guard';
import { RequirePermission } from '../subscriptions/require-permission.decorator';
import { YoutubeService } from './youtube.service';

@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('status')
  @UseGuards(AuthGuard, VerifiedGuard, PermissionsGuard)
  @RequirePermission('canStreamToYoutube')
  status(@Req() _req: Request & { user: AuthUser }) {
    return this.youtubeService.getConnectionStatus();
  }
}

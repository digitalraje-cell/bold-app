import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import type { Response } from 'express';
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
  status(@Req() req: Request & { user: AuthUser }) {
    return this.youtubeService.getConnectionStatus(req.user.id);
  }

  @Get('connect')
  @UseGuards(AuthGuard, VerifiedGuard, PermissionsGuard)
  @RequirePermission('canStreamToYoutube')
  connect(@Req() req: Request & { user: AuthUser }) {
    return this.youtubeService.getConnectUrl(req.user.id);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const frontend = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000';

    if (error || !code || !state) {
      return res.redirect(`${frontend}/settings/profile?youtube=error`);
    }

    let userId: string;
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {
        userId?: string;
      };
      if (!parsed.userId) throw new Error('missing userId');
      userId = parsed.userId;
    } catch {
      return res.redirect(`${frontend}/settings/profile?youtube=error`);
    }

    try {
      await this.youtubeService.handleOAuthCallback(code, userId);
      return res.redirect(`${frontend}/settings/profile?youtube=connected`);
    } catch {
      return res.redirect(`${frontend}/settings/profile?youtube=error`);
    }
  }

  @Post('disconnect')
  @UseGuards(AuthGuard, VerifiedGuard, PermissionsGuard)
  @RequirePermission('canStreamToYoutube')
  disconnect(@Req() req: Request & { user: AuthUser }) {
    return this.youtubeService.disconnect(req.user.id);
  }

  @Get('architecture')
  @UseGuards(AuthGuard)
  architecture() {
    return this.youtubeService.getArchitecture();
  }
}

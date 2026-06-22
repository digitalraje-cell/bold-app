import {
  Controller,
  Delete,
  Get,
  Param,
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
  status(
    @Req() req: Request & { user: AuthUser },
    @Query('refresh') refresh?: string,
  ) {
    return this.youtubeService.getConnectionStatus(
      req.user.id,
      refresh === 'true' || refresh === '1',
    );
  }

  @Get('connect')
  @UseGuards(AuthGuard, VerifiedGuard, PermissionsGuard)
  @RequirePermission('canStreamToYoutube')
  connect(
    @Req() req: Request & { user: AuthUser },
    @Query('returnTo') returnTo?: string,
  ) {
    return this.youtubeService.getConnectUrl(
      req.user.id,
      returnTo ?? '/settings/integrations',
    );
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const frontend = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000';

    let returnTo: string | null = null;
    let userId: string | null = null;

    if (state) {
      try {
        const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {
          userId?: string;
          returnTo?: string | null;
        };
        userId = parsed.userId ?? null;
        returnTo = parsed.returnTo ?? null;
      } catch {
        userId = null;
      }
    }

    const successRedirect = returnTo
      ? `${frontend}${returnTo.startsWith('/') ? returnTo : `/${returnTo}`}?youtube=connected`
      : `${frontend}/settings/integrations?youtube=connected`;
    const errorRedirect = returnTo
      ? `${frontend}${returnTo.startsWith('/') ? returnTo : `/${returnTo}`}?youtube=error`
      : `${frontend}/settings/integrations?youtube=error`;

    if (error || !code || !userId) {
      return res.redirect(errorRedirect);
    }

    try {
      await this.youtubeService.handleOAuthCallback(code, userId);
      return res.redirect(successRedirect);
    } catch {
      return res.redirect(errorRedirect);
    }
  }

  @Post('accounts/:accountId/refresh-eligibility')
  @UseGuards(AuthGuard, VerifiedGuard, PermissionsGuard)
  @RequirePermission('canStreamToYoutube')
  async refreshEligibility(
    @Req() req: Request & { user: AuthUser },
    @Param('accountId') accountId: string,
  ) {
    await this.youtubeService.refreshAccountEligibility(accountId, req.user.id);
    return this.youtubeService.getConnectionStatus(req.user.id, false);
  }

  @Delete('accounts/:accountId')
  @UseGuards(AuthGuard, VerifiedGuard, PermissionsGuard)
  @RequirePermission('canStreamToYoutube')
  disconnectAccount(
    @Req() req: Request & { user: AuthUser },
    @Param('accountId') accountId: string,
  ) {
    return this.youtubeService.disconnectAccount(req.user.id, accountId);
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

import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { TrackPwaAnalyticsDto } from './dto/track-pwa-analytics.dto';
import { PwaAnalyticsService } from './pwa-analytics.service';

@Controller('pwa')
export class PwaAnalyticsController {
  constructor(private readonly pwaAnalytics: PwaAnalyticsService) {}

  @Post('analytics')
  @UseGuards(OptionalAuthGuard)
  track(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: TrackPwaAnalyticsDto,
  ) {
    return this.pwaAnalytics.track(dto, { userId: req.user?.id });
  }

  @Get('admin/stats')
  @UseGuards(AuthGuard, AdminGuard)
  adminStats() {
    return this.pwaAnalytics.getAdminStats();
  }
}

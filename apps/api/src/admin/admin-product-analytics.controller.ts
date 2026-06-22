import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminProductAnalyticsService } from './admin-product-analytics.service';

@Controller('admin/product-analytics')
@UseGuards(AuthGuard, AdminGuard)
export class AdminProductAnalyticsController {
  constructor(private readonly analytics: AdminProductAnalyticsService) {}

  @Get('stats')
  stats() {
    return this.analytics.getStats();
  }
}

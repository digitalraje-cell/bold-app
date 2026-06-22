import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../admin/admin.guard';
import { PwaAnalyticsController } from './pwa-analytics.controller';
import { PwaAnalyticsService } from './pwa-analytics.service';

@Module({
  imports: [AuthModule],
  controllers: [PwaAnalyticsController],
  providers: [PwaAnalyticsService, AdminGuard],
  exports: [PwaAnalyticsService],
})
export class PwaModule {}

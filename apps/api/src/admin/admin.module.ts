import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from './admin.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminPaymentsService } from './admin-payments.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminReleasesController } from './admin-releases.controller';
import { AdminReleasesService } from './admin-releases.service';
import { AdminFeatureInterestController } from './admin-feature-interest.controller';
import { AdminFeatureInterestService } from './admin-feature-interest.service';
import { AdminProductAnalyticsController } from './admin-product-analytics.controller';
import { AdminProductAnalyticsService } from './admin-product-analytics.service';

@Module({
  imports: [AuthModule],
  controllers: [
    AdminPaymentsController,
    AdminUsersController,
    AdminReleasesController,
    AdminFeatureInterestController,
    AdminProductAnalyticsController,
  ],
  providers: [
    AdminPaymentsService,
    AdminUsersService,
    AdminReleasesService,
    AdminFeatureInterestService,
    AdminProductAnalyticsService,
    AdminGuard,
    SuperAdminGuard,
  ],
})
export class AdminModule {}

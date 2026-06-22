import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RegistrationModule } from '../registration/registration.module';
import { AdminRegistrationsController } from './admin-registrations.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminGuard } from './admin.guard';
import { AdminMeetingsController } from './admin-meetings.controller';
import { AdminMeetingsService } from './admin-meetings.service';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminPaymentsService } from './admin-payments.service';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [AuthModule, RegistrationModule],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminMeetingsController,
    AdminSubscriptionsController,
    AdminRegistrationsController,
    AdminPaymentsController,
  ],
  providers: [
    AdminDashboardService,
    AdminUsersService,
    AdminMeetingsService,
    AdminSubscriptionsService,
    AdminPaymentsService,
    AdminGuard,
  ],
})
export class AdminModule {}

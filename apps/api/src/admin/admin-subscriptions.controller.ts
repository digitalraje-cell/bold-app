import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminSubscriptionsService } from './admin-subscriptions.service';

@Controller('admin/subscriptions')
@UseGuards(AuthGuard, AdminGuard)
export class AdminSubscriptionsController {
  constructor(
    private readonly adminSubscriptionsService: AdminSubscriptionsService,
  ) {}

  @Get()
  listSubscriptions(@Query('search') search?: string) {
    return this.adminSubscriptionsService.listSubscriptions({ search });
  }
}

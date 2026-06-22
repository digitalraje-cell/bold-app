import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminFeatureInterestService } from './admin-feature-interest.service';

@Controller('admin/feature-interest')
@UseGuards(AuthGuard, AdminGuard)
export class AdminFeatureInterestController {
  constructor(private readonly featureInterest: AdminFeatureInterestService) {}

  @Get('stats')
  stats() {
    return this.featureInterest.getStats();
  }
}

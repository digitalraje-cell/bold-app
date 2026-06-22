import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminGuard } from './admin.guard';

@Controller('admin/dashboard')
@UseGuards(AuthGuard, AdminGuard)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get()
  getDashboard() {
    return this.adminDashboardService.getDashboard();
  }
}

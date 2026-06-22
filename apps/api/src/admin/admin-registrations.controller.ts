import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { RegistrationService } from '../registration/registration.service';

@Controller('admin/registrations')
@UseGuards(AuthGuard, AdminGuard)
export class AdminRegistrationsController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Get('stats')
  getStats() {
    return this.registrationService.getAdminStats();
  }
}

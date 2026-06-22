import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminUsersService } from './admin-users.service';

type AdminUserFilter = 'free' | 'paid' | 'active' | 'inactive';

@Controller('admin/users')
@UseGuards(AuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  listUsers(
    @Query('filter') filter?: AdminUserFilter,
    @Query('search') search?: string,
  ) {
    return this.adminUsersService.listUsers({ filter, search });
  }

  @Patch(':id/plan')
  changePlan(@Param('id') id: string, @Body('plan') plan: SubscriptionPlan) {
    return this.adminUsersService.changePlan(id, plan);
  }

  @Post(':id/deactivate')
  deactivateUser(@Param('id') id: string) {
    return this.adminUsersService.deactivateUser(id);
  }

  @Post(':id/activate')
  activateUser(@Param('id') id: string) {
    return this.adminUsersService.activateUser(id);
  }

  @Post(':id/activate-pro')
  activatePro(@Param('id') id: string) {
    return this.adminUsersService.activatePro(id);
  }

  @Post(':id/deactivate-pro')
  deactivatePro(@Param('id') id: string) {
    return this.adminUsersService.deactivatePro(id);
  }
}

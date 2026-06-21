import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminUsersService } from './admin-users.service';

@Controller('admin/users')
@UseGuards(AuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  listUsers() {
    return this.adminUsersService.listUsers();
  }

  @Post(':id/activate-pro')
  activatePro(@Param('id') id: string, @Req() req: Request & { user: AuthUser }) {
    return this.adminUsersService.activatePro(id, req.user.id);
  }

  @Post(':id/deactivate-pro')
  deactivatePro(@Param('id') id: string, @Req() req: Request & { user: AuthUser }) {
    return this.adminUsersService.deactivatePro(id, req.user.id);
  }
}

import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { PermissionsService } from './permissions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMyPlan(@Req() req: Request & { user: AuthUser }) {
    const ctx = await this.permissionsService.getUserPlanContext(req.user.id);
    const permissions = this.permissionsService.resolvePermissions(ctx.plan);
    return {
      plan: ctx.plan,
      isVerified: ctx.isVerified,
      permissions: permissions.permissions,
      limits: permissions.limits,
    };
  }
}

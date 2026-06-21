import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from './permissions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMyPlan(@Req() req: Request & { user: AuthUser }) {
    const ctx = await this.permissionsService.getUserPlanContext(req.user.id);
    const permissions = this.permissionsService.resolvePermissions(ctx.plan);
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });
    return {
      plan: ctx.plan,
      isVerified: ctx.isVerified,
      role: user?.role ?? 'USER',
      permissions: permissions.permissions,
      limits: permissions.limits,
    };
  }
}

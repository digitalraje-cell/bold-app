import { Injectable, ForbiddenException } from '@nestjs/common';
import {
  SubscriptionPlan,
  PermissionKey,
  resolvePlanPermissions,
  checkPermission,
  getPlanLimit,
  computeMeetingDurationStatus,
  MeetingDurationStatus,
  resolveEffectivePlan,
  resolvePlatformRole,
  isSuperAdmin,
} from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface UserPlanContext {
  userId: string;
  plan: SubscriptionPlan;
  isVerified: boolean;
}

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async getUserPlanContext(userId: string): Promise<UserPlanContext> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        isVerified: true,
        subscriptionExpiresAt: true,
      },
    });

    const role = resolvePlatformRole(user.role, user.email);
    let plan = user.subscriptionPlan as SubscriptionPlan;

    if (!isSuperAdmin(role, user.email)) {
      if (
        user.subscriptionExpiresAt &&
        user.subscriptionExpiresAt < new Date()
      ) {
        plan = SubscriptionPlan.FREE;
      }
    }

    plan = resolveEffectivePlan(role, plan, user.email);

    return {
      userId: user.id,
      plan,
      isVerified: user.isVerified,
    };
  }

  async check(userId: string, permission: PermissionKey): Promise<void> {
    const ctx = await this.getUserPlanContext(userId);
    if (!checkPermission(ctx.plan, permission)) {
      throw new ForbiddenException(
        `Your plan does not include access to: ${permission}`,
      );
    }
  }

  async getAttendeeLimit(
    userId: string,
    roomMode: 'MEETING' | 'WEBINAR' = 'MEETING',
  ): Promise<number> {
    const ctx = await this.getUserPlanContext(userId);
    const key =
      roomMode === 'WEBINAR' ? 'webinarAttendeeLimit' : 'meetingAttendeeLimit';
    return getPlanLimit(ctx.plan, key) ?? 100;
  }

  async getMaxCohosts(userId: string): Promise<number> {
    const ctx = await this.getUserPlanContext(userId);
    return getPlanLimit(ctx.plan, 'maxCohosts') ?? 1;
  }

  async getMeetingDurationStatus(
    hostId: string,
    startedAt: Date | null,
  ): Promise<MeetingDurationStatus | null> {
    if (!startedAt) return null;
    const ctx = await this.getUserPlanContext(hostId);
    return computeMeetingDurationStatus(startedAt, ctx.plan);
  }

  resolvePermissions(plan: SubscriptionPlan) {
    return resolvePlanPermissions(plan);
  }
}

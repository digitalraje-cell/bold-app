import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isPaidPlan } from '@boldmeet/shared';
import { PlanStatus, Prisma, SubscriptionPlan, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AdminUserFilter = 'free' | 'paid' | 'active' | 'inactive';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(options?: { filter?: AdminUserFilter; search?: string }) {
    const where: Prisma.UserWhereInput = {};

    if (options?.filter === 'free') {
      where.subscriptionPlan = SubscriptionPlan.FREE;
    } else if (options?.filter === 'paid') {
      where.subscriptionPlan = { not: SubscriptionPlan.FREE };
    } else if (options?.filter === 'active') {
      where.isActive = true;
    } else if (options?.filter === 'inactive') {
      where.isActive = false;
    }

    if (options?.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { profile: { mobile: { contains: q } } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        lastLoginAt: true,
        createdAt: true,
        profile: {
          select: {
            mobile: true,
            country: true,
            organization: true,
            designation: true,
          },
        },
        subscription: {
          select: {
            planName: true,
            planStatus: true,
            planStartDate: true,
            planExpiryDate: true,
            paymentStatus: true,
            paymentProvider: true,
          },
        },
        _count: { select: { hostedMeetings: true } },
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
      mobile: user.profile?.mobile ?? null,
      country: user.profile?.country ?? null,
      organization: user.profile?.organization ?? null,
      designation: user.profile?.designation ?? null,
      plan: user.subscription?.planName ?? user.subscriptionPlan,
      planStatus: user.subscription?.planStatus ?? PlanStatus.ACTIVE,
      planExpiryDate:
        user.subscription?.planExpiryDate ?? user.subscriptionExpiresAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      meetingsCreated: user._count.hostedMeetings,
      isPaid: isPaidPlan(user.subscriptionPlan),
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
    }));
  }

  async changePlan(userId: string, plan: SubscriptionPlan) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const expiry =
      plan === SubscriptionPlan.FREE
        ? null
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionPlan: plan,
          subscriptionExpiresAt: expiry,
        },
      }),
      this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          planName: plan,
          planStatus: PlanStatus.ACTIVE,
          planStartDate: now,
          planExpiryDate: expiry,
          paymentStatus: 'manual',
          paymentProvider: 'MANUAL',
        },
        update: {
          planName: plan,
          planStatus: PlanStatus.ACTIVE,
          planStartDate: now,
          planExpiryDate: expiry,
          paymentStatus: 'manual',
          paymentProvider: 'MANUAL',
        },
      }),
    ]);

    return { ok: true, userId, plan, expiresAt: expiry?.toISOString() ?? null };
  }

  async deactivateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot deactivate a Super Admin');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await this.prisma.subscription.updateMany({
      where: { userId },
      data: { planStatus: PlanStatus.INACTIVE },
    });

    return { ok: true, userId, isActive: false };
  }

  async activateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    await this.prisma.subscription.updateMany({
      where: { userId },
      data: { planStatus: PlanStatus.ACTIVE },
    });

    return { ok: true, userId, isActive: true };
  }

  /** @deprecated use changePlan */
  activatePro(userId: string) {
    return this.changePlan(userId, SubscriptionPlan.PRO);
  }

  /** @deprecated use changePlan */
  deactivatePro(userId: string) {
    return this.changePlan(userId, SubscriptionPlan.FREE);
  }
}

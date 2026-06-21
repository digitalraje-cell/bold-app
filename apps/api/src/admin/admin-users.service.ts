import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  async activatePro(userId: string, adminUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: SubscriptionPlan.PRO,
        subscriptionExpiresAt: expiresAt,
      },
    });

    return {
      ok: true,
      userId,
      plan: SubscriptionPlan.PRO,
      activatedBy: adminUserId,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async deactivatePro(userId: string, adminUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.subscriptionPlan !== SubscriptionPlan.PRO) {
      throw new BadRequestException('User is not on Pro');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: SubscriptionPlan.FREE,
        subscriptionExpiresAt: null,
      },
    });

    return {
      ok: true,
      userId,
      plan: SubscriptionPlan.FREE,
      deactivatedBy: adminUserId,
    };
  }
}

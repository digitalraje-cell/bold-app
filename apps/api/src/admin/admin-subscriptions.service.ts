import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  listSubscriptions(options?: { search?: string }) {
    const where: Prisma.SubscriptionWhereInput = {};

    if (options?.search?.trim()) {
      const q = options.search.trim();
      where.user = {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.subscription.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        planName: true,
        planStatus: true,
        planStartDate: true,
        planExpiryDate: true,
        customerId: true,
        subscriptionId: true,
        paymentStatus: true,
        paymentProvider: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
          },
        },
      },
    });
  }
}

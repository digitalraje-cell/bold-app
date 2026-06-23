import { Injectable } from '@nestjs/common';
import { PlanInterestType } from '@prisma/client';
import {
  isMaxDestinationDemand,
  isMaxPlanLaunched,
  isMaxWaitlistPlatformId,
  MAX_PLAN_DISPLAY,
} from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanInterestService {
  constructor(private readonly prisma: PrismaService) {}

  async getMaxWaitlistStatus(userId: string) {
    const entry = await this.prisma.planInterest.findUnique({
      where: {
        userId_planInterest: { userId, planInterest: PlanInterestType.MAX },
      },
    });

    return {
      plan: MAX_PLAN_DISPLAY.name,
      comingSoon: !isMaxPlanLaunched(),
      joined: Boolean(entry),
      requestedProviders: entry?.requestedProviders ?? [],
      expectedDestinations: entry?.expectedDestinations ?? null,
      joinedAt: entry?.createdAt.toISOString() ?? null,
      foundingOffer: MAX_PLAN_DISPLAY.foundingOffer,
    };
  }

  async joinMaxWaitlist(
    userId: string,
    requestedProviders: string[] = [],
    expectedDestinations?: string | null,
  ) {
    const normalized = [
      ...new Set(
        requestedProviders.map((p) => p.trim()).filter(isMaxWaitlistPlatformId),
      ),
    ];

    const destinations =
      expectedDestinations && isMaxDestinationDemand(expectedDestinations)
        ? expectedDestinations
        : null;

    const entry = await this.prisma.planInterest.upsert({
      where: {
        userId_planInterest: { userId, planInterest: PlanInterestType.MAX },
      },
      create: {
        userId,
        planInterest: PlanInterestType.MAX,
        requestedProviders: normalized,
        expectedDestinations: destinations,
      },
      update: {
        requestedProviders: normalized,
        expectedDestinations: destinations,
      },
    });

    return {
      plan: MAX_PLAN_DISPLAY.name,
      comingSoon: !isMaxPlanLaunched(),
      joined: true,
      requestedProviders: entry.requestedProviders,
      expectedDestinations: entry.expectedDestinations,
      joinedAt: entry.createdAt.toISOString(),
      foundingOffer: MAX_PLAN_DISPLAY.foundingOffer,
      message: MAX_PLAN_DISPLAY.foundingOffer,
    };
  }
}

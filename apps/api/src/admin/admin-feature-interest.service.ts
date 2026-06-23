import { Injectable } from '@nestjs/common';
import { PlanInterestType, SubscriptionPlan } from '@prisma/client';
import {
  MAX_DESTINATION_DEMAND_OPTIONS,
  STREAMING_PROVIDERS,
} from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminFeatureInterestService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const entries = await this.prisma.planInterest.findMany({
      where: { planInterest: PlanInterestType.MAX },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true, subscriptionPlan: true },
        },
      },
    });

    const providerCounts = new Map<string, number>();
    for (const provider of STREAMING_PROVIDERS) {
      providerCounts.set(provider.id, 0);
    }

    const destinationCounts = new Map<string, number>();
    for (const option of MAX_DESTINATION_DEMAND_OPTIONS) {
      destinationCounts.set(option.id, 0);
    }

    let proUsersOnWaitlist = 0;
    let freeUsersOnWaitlist = 0;
    let proWantingMultiPlatform = 0;
    let highIntentPro = 0;

    for (const entry of entries) {
      const plan = entry.user.subscriptionPlan;
      const nonYoutubeProviders = entry.requestedProviders.filter(
        (p) => p !== 'youtube',
      );
      const isPro = plan === SubscriptionPlan.PRO;

      if (isPro) {
        proUsersOnWaitlist += 1;
        if (nonYoutubeProviders.length > 0) proWantingMultiPlatform += 1;
        if (
          nonYoutubeProviders.length > 0 ||
          entry.expectedDestinations === '4-5' ||
          entry.expectedDestinations === '6+'
        ) {
          highIntentPro += 1;
        }
      } else if (plan === SubscriptionPlan.FREE) {
        freeUsersOnWaitlist += 1;
      }

      for (const provider of entry.requestedProviders) {
        providerCounts.set(provider, (providerCounts.get(provider) ?? 0) + 1);
      }

      if (entry.expectedDestinations) {
        destinationCounts.set(
          entry.expectedDestinations,
          (destinationCounts.get(entry.expectedDestinations) ?? 0) + 1,
        );
      }
    }

    const providerDemand = STREAMING_PROVIDERS.map((provider) => ({
      provider: provider.id,
      name: provider.name,
      status: provider.status,
      count: providerCounts.get(provider.id) ?? 0,
    }));

    const destinationDemand = MAX_DESTINATION_DEMAND_OPTIONS.map((option) => ({
      id: option.id,
      label: option.label,
      count: destinationCounts.get(option.id) ?? 0,
    }));

    const conversionOpportunities = {
      proUsersOnWaitlist,
      freeUsersOnWaitlist,
      proWantingMultiPlatform,
      highIntentPro,
      freeToProUpsell: freeUsersOnWaitlist,
      proToMaxUpsell: proUsersOnWaitlist,
    };

    return {
      maxWaitlistTotal: entries.length,
      providerDemand,
      destinationDemand,
      conversionOpportunities,
      /** @deprecated use providerDemand */
      usersWaitingFor: providerDemand.filter((p) => p.provider !== 'youtube'),
      recentSignups: entries.slice(0, 50).map((entry) => ({
        userId: entry.userId,
        email: entry.user.email,
        name: entry.user.name,
        plan: entry.user.subscriptionPlan,
        requestedProviders: entry.requestedProviders,
        expectedDestinations: entry.expectedDestinations,
        joinedAt: entry.createdAt.toISOString(),
      })),
    };
  }
}

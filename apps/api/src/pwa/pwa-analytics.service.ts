import { Injectable } from '@nestjs/common';
import { PwaAnalyticsEvent } from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';
import { TrackPwaAnalyticsDto } from './dto/track-pwa-analytics.dto';

@Injectable()
export class PwaAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(dto: TrackPwaAnalyticsDto, options?: { userId?: string }) {
    if (options?.userId) {
      await this.updateUserPwaState(options.userId, dto.event);
    }

    return { ok: true, event: dto.event };
  }

  async getAdminStats() {
    const [totalUsers, pwaInstalledUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isPwaInstalled: true } }),
    ]);

    const installationPercentage =
      totalUsers > 0 ? Math.round((pwaInstalledUsers / totalUsers) * 1000) / 10 : 0;

    return {
      totalUsers,
      pwaInstalledUsers,
      installationPercentage,
    };
  }

  private async updateUserPwaState(userId: string, event: PwaAnalyticsEvent) {
    if (event === 'PWA_INSTALLED') {
      const now = new Date();
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isPwaInstalled: true,
          pwaInstalledAt: now,
          lastPwaLaunchAt: now,
        },
      });
      return;
    }

    if (event === 'PWA_OPENED') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { pwaInstalledAt: true },
      });
      const now = new Date();

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isPwaInstalled: true,
          lastPwaLaunchAt: now,
          ...(user?.pwaInstalledAt ? {} : { pwaInstalledAt: now }),
        },
      });
    }
  }
}

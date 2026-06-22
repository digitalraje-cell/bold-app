import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformStats() {
    const [meetingsHosted, registeredUsers, participants] = await Promise.all([
      this.prisma.meeting.count(),
      this.prisma.user.count(),
      this.prisma.participant.findMany({
        select: { joinedAt: true, leftAt: true },
      }),
    ]);

    const now = Date.now();
    const hoursConnected = participants.reduce((total, participant) => {
      const end = participant.leftAt?.getTime() ?? now;
      const start = participant.joinedAt.getTime();
      const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
      return total + hours;
    }, 0);

    return {
      meetingsHosted,
      registeredUsers,
      /** Populated when user profile country data is available in the schema. */
      countriesReached: null as number | null,
      hoursConnected: Math.round(hoursConnected),
    };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ROADMAP_VOTABLE_FEATURES,
  RoadmapFeatureKey,
} from '@boldmeet/shared';
import { PrismaService } from '../prisma/prisma.service';

const VALID_KEYS = new Set<string>(ROADMAP_VOTABLE_FEATURES.map((f) => f.key));

@Injectable()
export class RoadmapService {
  constructor(private readonly prisma: PrismaService) {}

  private assertFeatureKey(featureKey: string): asserts featureKey is RoadmapFeatureKey {
    if (!VALID_KEYS.has(featureKey)) {
      throw new BadRequestException('Invalid feature key');
    }
  }

  async getVoteSummary(userId?: string) {
    const [counts, userVotes] = await Promise.all([
      this.prisma.roadmapVote.groupBy({
        by: ['featureKey'],
        _count: { featureKey: true },
      }),
      userId
        ? this.prisma.roadmapVote.findMany({
            where: { userId },
            select: { featureKey: true },
          })
        : Promise.resolve([]),
    ]);

    const countByKey = Object.fromEntries(
      counts.map((row) => [row.featureKey, row._count.featureKey]),
    );

    const votedKeys = new Set(userVotes.map((v) => v.featureKey));

    return ROADMAP_VOTABLE_FEATURES.map((feature) => ({
      key: feature.key,
      title: feature.title,
      voteCount: countByKey[feature.key] ?? 0,
      voted: votedKeys.has(feature.key),
    }));
  }

  async vote(userId: string, featureKey: string) {
    this.assertFeatureKey(featureKey);

    await this.prisma.roadmapVote.upsert({
      where: {
        userId_featureKey: { userId, featureKey },
      },
      create: { userId, featureKey },
      update: {},
    });

    const count = await this.prisma.roadmapVote.count({ where: { featureKey } });

    return { featureKey, voteCount: count, voted: true };
  }

  async removeVote(userId: string, featureKey: string) {
    this.assertFeatureKey(featureKey);

    await this.prisma.roadmapVote.deleteMany({
      where: { userId, featureKey },
    });

    const count = await this.prisma.roadmapVote.count({ where: { featureKey } });

    return { featureKey, voteCount: count, voted: false };
  }
}

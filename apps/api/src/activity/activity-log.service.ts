import { Injectable } from '@nestjs/common';
import { ActivityAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ActivityLogInput {
  userId?: string | null;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  log(input: ActivityLogInput) {
    return this.prisma.activityLog.create({
      data: {
        userId: input.userId ?? undefined,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  logSafe(input: ActivityLogInput): void {
    void this.log(input).catch((err) => {
      console.error('[activity-log] failed to write', err);
    });
  }
}

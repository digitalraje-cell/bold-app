import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export async function logUserActivity(
  userId: string,
  action: 'LOGIN' | 'LOGOUT',
  metadata?: Prisma.InputJsonValue,
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType: 'user',
        entityId: userId,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error('[activity-log] failed to write', error);
  }
}

export async function touchUserLogin(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

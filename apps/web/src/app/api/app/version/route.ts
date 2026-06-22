import { NextResponse } from 'next/server';
import { appVersion, buildTimestamp } from '@/lib/version';
import { prisma } from '@/lib/prisma';
import type { AppVersionResponse } from '@boldmeet/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const release = await prisma.appRelease.findFirst({
    orderBy: { releaseDate: 'desc' },
    select: {
      version: true,
      releaseDate: true,
      releaseNotes: true,
      forceUpdate: true,
    },
  });

  const body: AppVersionResponse = {
    appVersion,
    buildTimestamp,
    release: release
      ? {
          version: release.version,
          releaseDate: release.releaseDate.toISOString().slice(0, 10),
          releaseNotes: Array.isArray(release.releaseNotes)
            ? (release.releaseNotes as string[])
            : [],
          forceUpdate: release.forceUpdate,
        }
      : null,
  };

  return NextResponse.json(body);
}

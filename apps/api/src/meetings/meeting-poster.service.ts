import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { extractPosterAssetId } from './poster.util';

@Injectable()
export class MeetingPosterService {
  constructor(private readonly prisma: PrismaService) {}

  create(hostId: string, mimeType: string, data: Buffer) {
    return this.prisma.meetingPosterAsset.create({
      data: {
        hostId,
        mimeType,
        sizeBytes: data.length,
        data: new Uint8Array(data),
      },
    });
  }

  findById(posterId: string) {
    return this.prisma.meetingPosterAsset.findUnique({
      where: { id: posterId },
    });
  }

  async linkToMeeting(posterUrl: string | null | undefined, meetingId: string, hostId: string) {
    const posterId = extractPosterAssetId(posterUrl);
    if (!posterId) return;

    const asset = await this.prisma.meetingPosterAsset.findUnique({
      where: { id: posterId },
    });
    if (!asset || asset.hostId !== hostId) return;

    await this.prisma.meetingPosterAsset.update({
      where: { id: posterId },
      data: { meetingId },
    });
  }

  async replaceMeetingPoster(
    meetingId: string,
    hostId: string,
    previousPosterUrl: string | null | undefined,
    nextPosterUrl: string | null | undefined,
  ) {
    const previousId = extractPosterAssetId(previousPosterUrl);
    const nextId = extractPosterAssetId(nextPosterUrl);

    if (previousId && previousId !== nextId) {
      await this.deleteAssetIfOwned(previousId, hostId, meetingId);
    }

    if (nextId) {
      await this.linkToMeeting(nextPosterUrl, meetingId, hostId);
    }
  }

  async deleteAssetsForMeeting(meetingId: string) {
    await this.prisma.meetingPosterAsset.deleteMany({
      where: { meetingId },
    });
  }

  async deleteAssetIfOwned(posterId: string, hostId: string, meetingId?: string) {
    const asset = await this.prisma.meetingPosterAsset.findUnique({
      where: { id: posterId },
    });
    if (!asset || asset.hostId !== hostId) return;
    if (meetingId && asset.meetingId && asset.meetingId !== meetingId) return;

    await this.prisma.meetingPosterAsset.delete({
      where: { id: posterId },
    });
  }

  async deleteOrphanedUploads(hostId: string, olderThanMs = 24 * 60 * 60 * 1000) {
    const cutoff = new Date(Date.now() - olderThanMs);
    await this.prisma.meetingPosterAsset.deleteMany({
      where: {
        hostId,
        meetingId: null,
        createdAt: { lt: cutoff },
      },
    });
  }
}

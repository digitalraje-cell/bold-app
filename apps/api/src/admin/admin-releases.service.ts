import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppReleaseDto } from './dto/create-app-release.dto';

@Injectable()
export class AdminReleasesService {
  constructor(private readonly prisma: PrismaService) {}

  listReleases() {
    return this.prisma.appRelease.findMany({
      orderBy: { releaseDate: 'desc' },
      take: 50,
    });
  }

  createRelease(dto: CreateAppReleaseDto, createdById: string) {
    return this.prisma.appRelease.create({
      data: {
        version: dto.version.trim(),
        releaseDate: new Date(dto.releaseDate),
        releaseNotes: dto.releaseNotes,
        forceUpdate: dto.forceUpdate ?? false,
        createdById,
      },
    });
  }
}

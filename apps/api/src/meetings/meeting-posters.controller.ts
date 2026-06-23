import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AuthGuard, AuthUser } from '../auth/auth.guard';
import { VerifiedGuard } from '../auth/verified.guard';
import { MeetingPosterService } from './meeting-poster.service';

const MAX_POSTER_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

type UploadedPosterFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

@Controller('meetings/posters')
export class MeetingPostersController {
  constructor(private readonly posterService: MeetingPosterService) {}

  @Post('upload')
  @UseGuards(AuthGuard, VerifiedGuard)
  @UseInterceptors(
    FileInterceptor('poster', {
      limits: { fileSize: MAX_POSTER_BYTES },
    }),
  )
  async upload(
    @Req() req: Request & { user: AuthUser },
    @UploadedFile() file?: UploadedPosterFile,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Poster file is required');
    }

    const mimeType = file.mimetype.toLowerCase();
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BadRequestException('Poster must be JPEG, PNG, or WebP');
    }

    if (file.size > MAX_POSTER_BYTES) {
      throw new BadRequestException('Poster must be 5MB or smaller');
    }

    const asset = await this.posterService.create(
      req.user.id,
      mimeType,
      file.buffer,
    );

    return {
      id: asset.id,
      posterUrl: `/api/meetings/poster/${asset.id}`,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
    };
  }

  @Get(':posterId')
  async serve(@Param('posterId') posterId: string, @Res() res: Response) {
    const asset = await this.posterService.findById(posterId);
    if (!asset) {
      throw new NotFoundException('Poster not found');
    }

    res.set({
      'Content-Type': asset.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.send(Buffer.from(asset.data));
  }
}

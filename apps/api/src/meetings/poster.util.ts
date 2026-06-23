import { BadRequestException } from '@nestjs/common';

const POSTER_URL_PATTERN =
  /^(\/api\/meetings\/poster\/([a-z0-9]+)|https?:\/\/[^\s/]+\/api\/meetings\/poster\/([a-z0-9]+))$/i;

export function extractPosterAssetId(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const match = value.trim().match(POSTER_URL_PATTERN);
  return match?.[2] ?? match?.[3] ?? null;
}

export function normalizePosterUrl(value?: string | null): string | null {
  if (!value?.trim()) return null;

  const url = value.trim();

  if (url.startsWith('data:')) {
    throw new BadRequestException(
      'Poster must be uploaded separately. Inline image data is not supported.',
    );
  }

  if (!POSTER_URL_PATTERN.test(url)) {
    throw new BadRequestException('Poster URL is invalid');
  }

  return url;
}

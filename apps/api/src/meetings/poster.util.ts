import { BadRequestException } from '@nestjs/common';

const MAX_POSTER_BYTES = 400_000;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function normalizePosterUrl(value?: string | null): string | null {
  if (!value?.trim()) return null;

  const url = value.trim();

  if (url.startsWith('https://') || url.startsWith('http://')) {
    return url;
  }

  if (!url.startsWith('data:image/')) {
    throw new BadRequestException('Poster must be a JPEG, PNG, or WebP image');
  }

  const match = url.match(/^data:(image\/[a-z+]+);base64,/i);
  const mime = match?.[1]?.toLowerCase();
  if (!mime || !ALLOWED_MIME.has(mime)) {
    throw new BadRequestException('Poster must be JPEG, PNG, or WebP');
  }

  const base64 = url.split(',')[1] ?? '';
  const bytes = Math.ceil((base64.length * 3) / 4);
  if (bytes > MAX_POSTER_BYTES) {
    throw new BadRequestException('Poster image must be under 400KB');
  }

  return url;
}

#!/usr/bin/env node
/**
 * API-level poster upload verification (no auth — unit + optional live API).
 * Usage:
 *   node scripts/verify-poster-api.mjs
 *   API_BASE=http://127.0.0.1:4000 node scripts/verify-poster-api.mjs --live
 */
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const live = process.argv.includes('--live');
const apiBase = process.env.API_BASE || 'http://127.0.0.1:4000';

const results = [];
function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? `: ${detail}` : ''}`);
}

const { normalizePosterUrl, extractPosterAssetId } = await import(
  '../apps/api/src/meetings/poster.util.ts'
);

// Reject base64
for (const input of [
  'data:image/png;base64,abc',
  'data:image/jpeg;base64,/9j/4AAQ',
]) {
  try {
    normalizePosterUrl(input);
    record(`Rejects base64: ${input.slice(0, 24)}...`, false);
  } catch (error) {
    record(
      `Rejects base64: ${input.slice(0, 24)}...`,
      error instanceof Error && error.message.includes('Inline image data'),
      error instanceof Error ? error.message : String(error),
    );
  }
}

record(
  'Accepts relative poster URL',
  normalizePosterUrl('/api/meetings/poster/clxyz123abc') === '/api/meetings/poster/clxyz123abc',
);

record(
  'Accepts absolute poster URL',
  normalizePosterUrl('https://bold.robozant.com/api/meetings/poster/abc123') ===
    'https://bold.robozant.com/api/meetings/poster/abc123',
);

record(
  'Rejects arbitrary external URL',
  (() => {
    try {
      normalizePosterUrl('https://evil.com/poster.png');
      return false;
    } catch {
      return true;
    }
  })(),
);

record(
  'extractPosterAssetId works',
  extractPosterAssetId('/api/meetings/poster/testid123') === 'testid123',
);

// Controller response shape (static)
const controller = readFileSync(
  join(root, 'apps/api/src/meetings/meeting-posters.controller.ts'),
  'utf8',
);
record(
  'Upload returns posterUrl path',
  controller.includes('posterUrl: `/api/meetings/poster/${asset.id}`') ||
    controller.includes("posterUrl: `/api/meetings/poster/${asset.id}`"),
);

record(
  'Serve sets image content-type',
  controller.includes("'Content-Type': asset.mimeType"),
);

// Migration files
const m1 = readFileSync(
  join(root, 'apps/api/prisma/migrations/20250623140000_meeting_poster_assets/migration.sql'),
  'utf8',
);
const m2 = readFileSync(
  join(root, 'apps/api/prisma/migrations/20250623150000_meeting_poster_asset_meeting_link/migration.sql'),
  'utf8',
);
const mPoster = readFileSync(
  join(root, 'apps/api/prisma/migrations/20250623120000_meeting_poster/migration.sql'),
  'utf8',
);

record('Migration: meeting_poster_assets table', m1.includes('CREATE TABLE "meeting_poster_assets"'));
record('Migration: posterUrl column', mPoster.includes('"posterUrl"'));
record(
  'Migration: meetingId ON DELETE CASCADE',
  m2.includes('ON DELETE CASCADE') && m2.includes('"meetingId"'),
);

if (live) {
  const health = await fetch(`${apiBase}/api/health`).catch(() => null);
  record('API health', health?.ok === true, health ? `status ${health.status}` : 'unreachable');

  const missing = await fetch(`${apiBase}/api/meetings/posters/does-not-exist`);
  record('GET missing poster returns 404', missing.status === 404, `status ${missing.status}`);

  const noAuth = await fetch(`${apiBase}/api/meetings/posters/upload`, { method: 'POST' });
  record(
    'POST upload without auth rejected',
    noAuth.status === 401 || noAuth.status === 403,
    `status ${noAuth.status}`,
  );

  // Tiny valid webp for serve test if we had auth — skip without token
}

// Compression thresholds (static from source)
const compression = readFileSync(join(root, 'apps/web/src/lib/meeting-poster-image.ts'), 'utf8');
record('Max input 5MB', compression.includes('5 * 1024 * 1024'));
record('Blocks before upload in component', readFileSync(join(root, 'apps/web/src/components/meeting/MeetingPosterUpload.tsx'), 'utf8').includes('compressMeetingPoster'));

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exit(1);

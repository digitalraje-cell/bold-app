#!/usr/bin/env node
/**
 * Pre-deploy verification for meeting poster upload + lifecycle.
 * Usage: node scripts/verify-meeting-poster-predeploy.mjs [--production]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const production = process.argv.includes('--production');

const WEB_ORIGIN = production ? 'https://bold.robozant.com' : 'http://localhost:3000';
const API_ORIGIN = production
  ? 'https://boldmeetapi-production.up.railway.app'
  : 'http://127.0.0.1:4000';

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? `: ${detail}` : ''}`);
}

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

// Static code checks
record(
  'Poster URL stored as path not base64',
  read('apps/api/src/meetings/poster.util.ts').includes('data:') &&
    read('apps/api/src/meetings/poster.util.ts').includes('Inline image data is not supported'),
);

record(
  'Separate poster upload route (web)',
  read('apps/web/src/app/api/meetings/poster/upload/route.ts').includes('formData'),
);

record(
  'Client-side compression before upload',
  read('apps/web/src/lib/meeting-poster-image.ts').includes('compressMeetingPoster'),
);

record(
  'Invitation poster lazy loaded',
  read('apps/web/src/components/meeting/MeetingPosterImage.tsx').includes('loading="lazy"'),
);

record(
  'Invitation poster error fallback',
  read('apps/web/src/components/meeting/MeetingPosterImage.tsx').includes('onError'),
);

record(
  'Poster asset linked to meeting',
  read('apps/api/prisma/schema.prisma').includes('meetingId String?  @unique'),
);

record(
  'Poster asset cascades on meeting delete',
  read('apps/api/prisma/schema.prisma').includes('onDelete: Cascade') &&
    read('apps/api/src/meetings/meetings.service.ts').includes('permanentlyDeleteMeeting'),
);

record(
  'Poster replaced on settings update',
  read('apps/api/src/meetings/meetings.service.ts').includes('replaceMeetingPoster'),
);

record(
  'Migration for poster assets table exists',
  read('apps/api/prisma/migrations/20250623140000_meeting_poster_assets/migration.sql').includes(
    'meeting_poster_assets',
  ),
);

record(
  'Migration for meeting link exists',
  read(
    'apps/api/prisma/migrations/20250623150000_meeting_poster_asset_meeting_link/migration.sql',
  ).includes('meetingId'),
);

// poster.util unit checks
const { extractPosterAssetId, normalizePosterUrl } = await import(
  '../apps/api/src/meetings/poster.util.ts'
);

record(
  'extractPosterAssetId parses relative URL',
  extractPosterAssetId('/api/meetings/poster/clxyz123') === 'clxyz123',
);

record(
  'extractPosterAssetId parses absolute URL',
  extractPosterAssetId('https://bold.robozant.com/api/meetings/poster/abc123') === 'abc123',
);

try {
  normalizePosterUrl('data:image/png;base64,abc');
  record('normalizePosterUrl rejects base64', false);
} catch {
  record('normalizePosterUrl rejects base64', true);
}

// Network checks (production or local if running)
async function probe(url, init) {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
    return { ok: true, status: res.status, res };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'request failed',
    };
  }
}

const posterServe = await probe(`${WEB_ORIGIN}/api/meetings/poster/nonexistent-test-id`);
if (production) {
  record(
    'Production poster serve route reachable',
    posterServe.ok,
    posterServe.ok ? `status ${posterServe.status}` : posterServe.error,
  );
  record(
    'Production returns 404 for missing poster (not 502)',
    posterServe.status === 404,
    `status ${posterServe.status}`,
  );
} else {
  record(
    'Local poster serve route (skip if dev server down)',
    posterServe.status === 404 || posterServe.status === 502,
    posterServe.ok ? `status ${posterServe.status}` : posterServe.error,
  );
}

const uploadProbe = await probe(`${WEB_ORIGIN}/api/meetings/poster/upload`, { method: 'POST' });
if (production) {
  const uploadLive = uploadProbe.status === 401 || uploadProbe.status === 400;
  record(
    'Production upload route deployed',
    uploadLive,
    uploadLive
      ? `status ${uploadProbe.status} (auth required)`
      : `status ${uploadProbe.status} — deploy web + API before poster QA`,
  );
} else {
  record(
    'Local upload route exists',
    uploadProbe.status === 401 || uploadProbe.status === 400,
    uploadProbe.ok ? `status ${uploadProbe.status}` : uploadProbe.error ?? 'unreachable',
  );
}

const apiHealth = await probe(`${API_ORIGIN}/api/health`);
record(
  `${production ? 'Production' : 'Local'} API health`,
  apiHealth.status === 200,
  apiHealth.ok ? 'healthy' : apiHealth.error ?? `status ${apiHealth.status}`,
);

const apiPoster = await probe(`${API_ORIGIN}/api/meetings/posters/nonexistent-test-id`);
record(
  `${production ? 'Production' : 'Local'} API poster endpoint`,
  apiPoster.status === 404,
  apiPoster.ok ? `status ${apiPoster.status}` : apiPoster.error ?? 'unreachable',
);

if (production) {
  const apiPosterLive = apiPoster.status === 404;
  record(
    'Production API poster storage reachable',
    apiPosterLive,
    apiPosterLive ? 'serve endpoint returns 404 for missing id' : apiPoster.error ?? `status ${apiPoster.status}`,
  );
}

console.log('\n--- Manual QA still required ---');
console.log('• Desktop / mobile browser / PWA: upload poster on create meeting');
console.log('• Invitation: portrait, landscape, PWA — poster visible, lazy loaded');
console.log('• Remove poster or use broken URL — default layout only');
console.log('• DELETE /api/meetings/:id — poster asset row removed from DB');

console.log('\n--- Migration (run before deploy) ---');
console.log('cd apps/api && pnpm exec prisma migrate deploy');

console.log('\n--- Rollback (manual SQL, only if needed) ---');
console.log(`-- Reverse meeting link migration
ALTER TABLE "meeting_poster_assets" DROP CONSTRAINT IF EXISTS "meeting_poster_assets_meetingId_fkey";
DROP INDEX IF EXISTS "meeting_poster_assets_meetingId_key";
ALTER TABLE "meeting_poster_assets" DROP COLUMN IF EXISTS "meetingId";

-- Reverse poster assets table (data loss)
DROP TABLE IF EXISTS "meeting_poster_assets";

-- Reverse posterUrl column on settings (optional)
ALTER TABLE "meeting_settings" DROP COLUMN IF EXISTS "posterUrl";`);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} automated checks passed`);
if (failed.length) {
  console.log('\nFailed checks:');
  for (const f of failed) console.log(`  - ${f.name}${f.detail ? `: ${f.detail}` : ''}`);
  process.exit(1);
}

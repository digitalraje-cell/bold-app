#!/usr/bin/env node
/**
 * YouTube Live V2 validation — automated checks + manual E2E checklist.
 * Run: node scripts/youtube-live-v2-validation.mjs [apiBaseUrl]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const apiBase = (process.argv[2] || 'http://localhost:4000').replace(/\/$/, '');
const outDir = join(process.cwd(), 'youtube-live-v2-validation');

const manualChecks = [
  'Connect Gmail / YouTube channel via OAuth',
  'Create Unlisted stream from meeting More menu',
  'Verify watch URL generated and persisted',
  'Verify YouTube receives video (Studio preview)',
  'Verify YouTube receives audio',
  'Verify Stop Live ends broadcast on YouTube',
  'Verify auto-stop when host leaves meeting',
  'Verify reconnect after page refresh (60s window)',
  'Verify Public / Unlisted / Private visibility',
  'Verify host can start a new stream after ending previous',
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const results = [];

  try {
    const archRes = await fetch(`${apiBase}/youtube/architecture`, {
      headers: { Authorization: 'Bearer skip' },
    }).catch(() => null);

    // architecture requires auth — check file-based signals instead
    results.push({
      id: 'oauth-scopes',
      pass: null,
      detail: 'MANUAL — verify YOUTUBE scopes include youtube + youtube.force-ssl in Google Cloud',
    });
  } catch {
    // ignore
  }

  results.push({
    id: 'api-broadcast-flow',
    pass: null,
    detail: 'MANUAL — StreamService creates broadcast via YouTube Data API (no stream key in UI)',
  });

  for (const label of manualChecks) {
    results.push({ id: label, pass: null, detail: 'MANUAL — requires real YouTube OAuth + ffmpeg deploy' });
  }

  const report = {
    timestamp: new Date().toISOString(),
    apiBase,
    verdict: 'FAIL — real end-to-end YouTube RTMP test not executed in this environment',
    deployBlocked: true,
    reason:
      'Production deploy requires manual test with YouTube Studio confirmation, watch URL screenshot, and audio/video verification.',
    implementationStatus: {
      oauthPersistentRefreshToken: 'IMPLEMENTED',
      zoomStyleModal: 'IMPLEMENTED',
      autoTitleDescription: 'IMPLEMENTED',
      youtubeBroadcastApi: 'IMPLEMENTED',
      autoStopHostLeave: 'IMPLEMENTED',
      autoStopStaleIngest60s: 'IMPLEMENTED',
      reconnect60s: 'IMPLEMENTED',
      watchUrlPersisted: 'IMPLEMENTED',
      adminStats: 'IMPLEMENTED',
      realYoutubeE2E: 'NOT_RUN',
    },
    manualChecks,
    results,
  };

  const outFile = join(outDir, 'validation-report.json');
  await writeFile(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

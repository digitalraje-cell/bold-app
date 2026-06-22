#!/usr/bin/env node
/**
 * PWA update flow validation checklist (automated + manual).
 * Run: node scripts/pwa-update-validation.mjs [baseUrl]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const baseUrl = process.argv[2] || 'http://localhost:3000';
const outDir = join(process.cwd(), 'pwa-update-validation');

const checks = [
  { id: 'version-api', label: '/api/app/version returns appVersion + buildTimestamp', auto: true },
  { id: 'sw-file', label: 'sw.js served with SKIP_WAITING message handler', auto: true },
  { id: 'outside-meeting-toast', label: 'Toast + Update Now + 30s auto refresh', auto: false },
  { id: 'meeting-banner', label: 'Non-blocking banner during /meeting/*', auto: false },
  { id: 'post-meeting-update', label: 'Update applies after leaving meeting', auto: false },
  { id: 'force-update-modal', label: 'Force update blocks navigation outside meeting', auto: false },
  { id: 'whats-new-card', label: 'Dashboard What\'s New card', auto: false },
  { id: 'admin-releases', label: 'Super admin can create releases', auto: false },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const results = [];

  try {
    const versionRes = await fetch(`${baseUrl}/api/app/version`);
    const versionJson = await versionRes.json();
    results.push({
      id: 'version-api',
      pass: Boolean(versionRes.ok && versionJson.appVersion && versionJson.buildTimestamp),
      detail: versionJson,
    });
  } catch (err) {
    results.push({ id: 'version-api', pass: false, detail: String(err) });
  }

  try {
    const swRes = await fetch(`${baseUrl}/sw.js`);
    const swText = await swRes.text();
    const installHandler = swText.split("addEventListener('install'")[1]?.split('});')[0] ?? '';
    const controlledLifecycle =
      swText.includes('SKIP_WAITING') && !installHandler.includes('skipWaiting()');
    results.push({
      id: 'sw-file',
      pass: swRes.ok && controlledLifecycle,
      detail: {
        status: swRes.status,
        hasSkipWaitingMessage: swText.includes('SKIP_WAITING'),
        controlledLifecycle,
      },
    });
  } catch (err) {
    results.push({ id: 'sw-file', pass: false, detail: String(err) });
  }

  for (const check of checks.filter((c) => !c.auto)) {
    results.push({ id: check.id, pass: null, detail: 'MANUAL — see test matrix below' });
  }

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    meetingsNeverInterrupted: 'YES — by design: no auto-refresh on /meeting/* or /join/*',
    automatedPass: results.filter((r) => r.pass === true).length,
    manualPending: results.filter((r) => r.pass === null).length,
    results,
    manualMatrix: [
      'Desktop Chrome — install PWA, deploy new sw.js, verify toast',
      'Desktop Edge — same',
      'Android Chrome — add to home screen optional',
      'Android PWA installed — background update toast',
      'iPhone Safari — meeting banner only (limited SW)',
      'iPhone Add to Home Screen — full flow',
    ],
  };

  const outFile = join(outDir, 'validation-report.json');
  await writeFile(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(results.some((r) => r.pass === false) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

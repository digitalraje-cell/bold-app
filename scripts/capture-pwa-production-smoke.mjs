#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'pwa-production-smoke');
const BASE = process.env.PROD_URL || 'https://bold.robozant.com';

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  // Desktop Chrome - join gate
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/join/demo123`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUT, '01-prod-join-desktop.png') });

    const sw = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      const reg = await navigator.serviceWorker.getRegistration();
      return { supported: true, active: Boolean(reg?.active), scope: reg?.scope ?? null };
    });
    await writeFile(path.join(OUT, 'sw-status-desktop.json'), JSON.stringify(sw, null, 2));
    await ctx.close();
  }

  // Mobile - join gate
  {
    const ctx = await browser.newContext({ ...devices['iPhone 14'] });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/join/demo123`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUT, '02-prod-join-mobile-safari-ua.png') });
    await ctx.close();
  }

  // Android Chrome UA
  {
    const ctx = await browser.newContext({ ...devices['Pixel 7'] });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/join/demo123`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUT, '03-prod-join-android.png') });
    await ctx.close();
  }

  // Manifest fetch
  const manifestRes = await fetch(`${BASE}/manifest.webmanifest`);
  const manifest = await manifestRes.json();
  await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  await browser.close();
  console.log(`Production smoke screenshots: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

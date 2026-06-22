#!/usr/bin/env node
/**
 * Capture design audit screenshots from local dev server.
 * Usage: node scripts/capture-design-audit.mjs [baseUrl]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const baseUrl = process.argv[2] || 'http://localhost:3000';
const outDir = join(process.cwd(), 'design-audit-screenshots');

const routes = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'contact', path: '/contact' },
  { name: 'pricing', path: '/#pricing' },
  { name: 'roadmap', path: '/roadmap' },
  { name: 'login', path: '/login' },
  { name: 'terms', path: '/terms' },
  { name: 'privacy', path: '/privacy' },
  { name: 'refund', path: '/refund' },
  { name: 'cookies', path: '/cookies' },
];

async function main() {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.error('Playwright not installed. Run: pnpm add -D playwright && npx playwright install chromium');
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const manifest = [];

  for (const route of routes) {
    const url = `${baseUrl}${route.path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(800);
      const file = join(outDir, `${route.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      manifest.push({ route: route.name, url, file, status: 'ok' });
      console.log(`✓ ${route.name}`);
    } catch (err) {
      manifest.push({ route: route.name, url, status: 'error', error: String(err) });
      console.error(`✗ ${route.name}:`, err.message);
    }
  }

  await browser.close();
  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nScreenshots saved to ${outDir}`);
}

main();

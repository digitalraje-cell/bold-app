import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const baseUrl = process.argv[2] || 'http://localhost:3000';
const outDir = join(process.cwd(), 'sidebar-active-screenshots');

const routes = [
  { name: 'before-dashboard-compare', path: '/dev/sidebar-audit?path=/dashboard', viewport: { width: 1200, height: 700 } },
  { name: 'after-dashboard-desktop', path: '/dev/sidebar-audit?path=/dashboard&view=desktop', viewport: { width: 400, height: 600 } },
  { name: 'after-meetings-desktop', path: '/dev/sidebar-audit?path=/dashboard/meetings&view=desktop', viewport: { width: 400, height: 600 } },
  { name: 'after-billing-desktop', path: '/dev/sidebar-audit?path=/billing&view=desktop', viewport: { width: 400, height: 600 } },
  { name: 'after-settings-desktop', path: '/dev/sidebar-audit?path=/settings/profile&view=desktop', viewport: { width: 400, height: 600 } },
  { name: 'after-dashboard-mobile', path: '/dev/sidebar-audit?path=/dashboard&view=mobile', viewport: { width: 390, height: 700 }, isMobile: true },
  { name: 'after-meetings-mobile', path: '/dev/sidebar-audit?path=/dashboard/meetings&view=mobile', viewport: { width: 390, height: 700 }, isMobile: true },
];

async function main() {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.error('Playwright not installed.');
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  const browser = await playwright.chromium.launch();
  const manifest = [];

  for (const route of routes) {
    const context = await browser.newContext({
      viewport: route.viewport,
      deviceScaleFactor: 2,
      isMobile: route.isMobile ?? false,
      hasTouch: route.isMobile ?? false,
    });
    const page = await context.newPage();
    const url = `${baseUrl}${route.path}`;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('nav', { timeout: 15000 });
      const file = join(outDir, `${route.name}.png`);
      await page.screenshot({ path: file });
      manifest.push({ name: route.name, url, file, status: 'ok' });
      console.log(`✓ ${route.name}`);
    } catch (err) {
      manifest.push({ name: route.name, url, status: 'error', error: String(err) });
      console.error(`✗ ${route.name}:`, err instanceof Error ? err.message : err);
    }

    await context.close();
  }

  await browser.close();
  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nScreenshots saved to ${outDir}`);
}

main();

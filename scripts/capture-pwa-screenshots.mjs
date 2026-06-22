import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const baseUrl = process.argv[2] || 'http://localhost:3002';
const outDir = join(process.cwd(), 'pwa-audit-screenshots');

const routes = [
  { name: '01-join-desktop', path: '/join/demo123', viewport: { width: 1440, height: 900 } },
  { name: '02-join-mobile', path: '/join/demo123', viewport: { width: 390, height: 844 }, isMobile: true },
  { name: '03-dashboard-banner', path: '/dev/pwa-audit#dashboard-banner', viewport: { width: 1440, height: 900 } },
  { name: '04-admin-analytics', path: '/dev/pwa-audit#admin-analytics', viewport: { width: 1440, height: 900 } },
  { name: '05-chrome-install-ui', path: '/dev/pwa-audit#chrome-install', viewport: { width: 1440, height: 900 } },
  { name: '06-mobile-install-ui', path: '/dev/pwa-audit#mobile-install', viewport: { width: 390, height: 844 }, isMobile: true },
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
      userAgent: route.isMobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    const url = `${baseUrl}${route.path}`;

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(600);

      if (route.path.includes('#')) {
        const hash = route.path.split('#')[1];
        await page.locator(`#${hash}`).scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
      }

      const file = join(outDir, `${route.name}.png`);
      await page.screenshot({ path: file, fullPage: route.name.includes('join') });
      manifest.push({ name: route.name, url, file, status: 'ok' });
      console.log(`✓ ${route.name}`);
    } catch (err) {
      manifest.push({ name: route.name, url, status: 'error', error: String(err) });
      console.error(`✗ ${route.name}:`, err instanceof Error ? err.message : err);
    }

    await context.close();
  }

  // Manifest JSON in browser DevTools style
  const manifestPage = await browser.newPage();
  await manifestPage.goto(`${baseUrl}/manifest.webmanifest`, { waitUntil: 'networkidle' });
  const manifestFile = join(outDir, '07-manifest.json');
  const manifestBody = await manifestPage.content();
  const jsonMatch = manifestBody.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    await writeFile(manifestFile, JSON.stringify(JSON.parse(jsonMatch[0]), null, 2));
    console.log('✓ 07-manifest.json');
  }

  await browser.close();
  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nScreenshots saved to ${outDir}`);
}

main();

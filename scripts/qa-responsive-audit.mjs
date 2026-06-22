#!/usr/bin/env node
/**
 * Launch readiness responsive audit — screenshots + horizontal overflow detection.
 * Usage: QA_BASE_URL=http://localhost:3000 node scripts/qa-responsive-audit.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'qa-screenshots');
const REPORT_PATH = path.join(ROOT, 'docs', 'qa-audit-results.json');

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3000';
const WIDTHS = [320, 360, 375, 390, 412, 768, 1024, 1366, 1440, 1920];
const VIEWPORT_HEIGHT = 900;

const ROUTES = [
  { id: 'home', path: '/', name: 'Home' },
  { id: 'pricing', path: '/#pricing', name: 'Pricing', scrollTo: '#pricing' },
  { id: 'about', path: '/about', name: 'About' },
  { id: 'contact', path: '/contact', name: 'Contact' },
  { id: 'login', path: '/login', name: 'Login' },
  { id: 'dashboard', path: '/dashboard', name: 'Dashboard' },
  { id: 'meetings', path: '/meetings', name: 'Meetings' },
  { id: 'billing', path: '/billing', name: 'Billing' },
  { id: 'settings', path: '/settings', name: 'Settings' },
  { id: 'integrations', path: '/settings/integrations', name: 'Integrations' },
  { id: 'admin', path: '/admin', name: 'Admin' },
  { id: 'join-meeting', path: '/join/demo', name: 'Join Meeting' },
  { id: 'max', path: '/max', name: 'Max Plan' },
];

async function detectOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
    const clientWidth = doc.clientWidth;
    const overflowPx = scrollWidth - clientWidth;
    const offenders = [];
    if (overflowPx > 1) {
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        if (rect.right > clientWidth + 1) {
          const tag = el.tagName.toLowerCase();
          const cls =
            typeof el.className === 'string' && el.className
              ? el.className.split(/\s+/).slice(0, 3).join(' ')
              : '';
          offenders.push({
            tag,
            class: cls,
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          });
          if (offenders.length >= 5) break;
        }
      }
    }
    return {
      hasOverflow: overflowPx > 1,
      overflowPx: Math.round(overflowPx),
      scrollWidth,
      clientWidth,
      offenders,
    };
  });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: VIEWPORT_HEIGHT },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const slug = `${route.id}-${width}`;
      const shotPath = path.join(OUT_DIR, `${slug}.png`);
      let status = 'PASS';
      let error = null;
      let overflow = null;

      try {
        await page.goto(`${BASE_URL}${route.path}`, {
          waitUntil: 'networkidle',
          timeout: 45000,
        });
        if (route.scrollTo) {
          await page.locator(route.scrollTo).scrollIntoViewIfNeeded().catch(() => {});
          await page.waitForTimeout(400);
        }
        overflow = await detectOverflow(page);
        if (overflow.hasOverflow) status = 'FAIL';
        await page.screenshot({ path: shotPath, fullPage: true });
      } catch (err) {
        status = 'ERROR';
        error = err instanceof Error ? err.message : String(err);
      }

      results.push({
        route: route.name,
        routeId: route.id,
        width,
        status,
        overflow,
        screenshot: `docs/qa-screenshots/${slug}.png`,
        error,
      });

      await context.close();
      process.stdout.write(status === 'PASS' ? '.' : 'F');
    }
  }

  await browser.close();
  console.log('\nDone.');

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    total: results.length,
    pass: results.filter((r) => r.status === 'PASS').length,
    fail: results.filter((r) => r.status === 'FAIL').length,
    error: results.filter((r) => r.status === 'ERROR').length,
    results,
  };

  writeFileSync(REPORT_PATH, JSON.stringify(summary, null, 2));
  console.log(`Report: ${REPORT_PATH}`);
  console.log(`Screenshots: ${OUT_DIR}`);
  console.log(`PASS ${summary.pass} / FAIL ${summary.fail} / ERROR ${summary.error}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

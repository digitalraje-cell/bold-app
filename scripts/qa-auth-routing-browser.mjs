/**
 * Browser QA — auth + root routing regression (Playwright).
 *
 * Usage:
 *   QA_BASE_URL=http://localhost:3456 node scripts/qa-auth-routing-browser.mjs
 *   QA_BASE_URL=https://bold.robozant.com DATABASE_URL=... node scripts/qa-auth-routing-browser.mjs
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const require = createRequire(path.join(ROOT, 'apps/web/package.json'));
const { PrismaClient } = require('@prisma/client');
const BASE_URL = (process.env.QA_BASE_URL || 'http://localhost:3456').replace(/\/$/, '');
const QA_EMAIL = (process.env.QA_EMAIL || 'qa-browser@bold.test').toLowerCase();
const QA_OTP = process.env.QA_OTP || '847291';
const SCREENSHOT_DIR = path.join(ROOT, 'docs/qa-screenshots/auth-routing');

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

const results = [];

function pass(name) {
  results.push({ name, ok: true });
  console.log(`✓ ${name}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}: ${detail}`);
}

function hashOtpCode(code) {
  return createHash('sha256').update(code).digest('hex');
}

async function seedOtp(email, code) {
  await prisma.otpVerification.updateMany({
    where: { email, used: false },
    data: { used: true },
  });
  await prisma.otpVerification.create({
    data: {
      email,
      codeHash: hashOtpCode(code),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
}

async function readDevOtpFromLog(email, { afterByte = 0 } = {}) {
  const logPath = process.env.QA_SERVER_LOG;
  if (!logPath) {
    throw new Error('Set QA_SERVER_LOG to the Next.js server terminal log for OTP capture');
  }

  const pattern = new RegExp(
    `dev code for ${email.replaceAll('.', '\\.')}: (\\d{6})`,
  );

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const content = await readFile(logPath, 'utf8');
    const slice = content.slice(afterByte);
    const match = slice.match(pattern);
    if (match) {
      return match[1];
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`OTP for ${email} not found in ${logPath}`);
}

async function loginViaBrowser(page, email, { useSeededOtp = false, otp } = {}) {
  if (useSeededOtp && otp) {
    await seedOtp(email, otp);
    const csrfResponse = await page.request.get(`${BASE_URL}/api/auth/csrf`);
    const { csrfToken } = await csrfResponse.json();
    const loginResponse = await page.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
      form: {
        csrfToken,
        email,
        otp,
        callbackUrl: `${BASE_URL}/dashboard`,
        json: 'true',
      },
    });
    if (!loginResponse.ok()) {
      throw new Error(`Credentials login failed (${loginResponse.status()})`);
    }
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    return;
  }

  await prisma.otpVerification.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email address').fill(email);

  const logPath = process.env.QA_SERVER_LOG;
  const logOffset = logPath ? (await readFile(logPath, 'utf8')).length : 0;

  const sendResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/auth/otp/send') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Send OTP' }).click();
  const sendResponse = await sendResponsePromise;
  const sendBody = await sendResponse.json();
  if (!sendResponse.ok()) {
    throw new Error(`Send OTP failed: ${JSON.stringify(sendBody)}`);
  }

  await page.getByRole('heading', { name: 'Enter your code' }).waitFor({ timeout: 15000 });
  const code = await readDevOtpFromLog(email, { afterByte: logOffset });
  console.log(`Using OTP ${code} for ${email}`);
  await page.getByPlaceholder('6-digit code').fill(code);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to seed OTP for browser login');
  }

  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log(`Browser QA\nBASE: ${BASE_URL}\nEMAIL: ${QA_EMAIL}\n`);

  try {
    // 1–3 Login and dashboard
    await loginViaBrowser(page, QA_EMAIL);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });

    const welcome = page.getByRole('heading', { name: /Welcome back/i });
    const signOutBtn = page.getByRole('button', { name: 'Sign out' });
    const emailInSidebar = page.locator('aside').getByText(QA_EMAIL);

    if (await welcome.isVisible()) pass('Dashboard shows authenticated welcome');
    else fail('Dashboard shows authenticated welcome', 'Welcome heading not visible');

    if (await signOutBtn.isVisible()) pass('Sign out button visible on dashboard');
    else fail('Sign out button visible on dashboard', 'Sign out not found');

    if (await emailInSidebar.isVisible()) pass('User email shown in sidebar');
    else fail('User email shown in sidebar', `${QA_EMAIL} not in sidebar`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-dashboard-logged-in.png'),
      fullPage: true,
    });

    // 4 Sign out
    await signOutBtn.click();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    if (page.url().replace(/\/$/, '') === BASE_URL) pass('Sign out lands on /');
    else fail('Sign out lands on /', `URL is ${page.url()}`);

    const joinHeading = page.getByRole('heading', { name: /Join or start a meeting/i });
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    const signInLink = page.getByRole('link', { name: 'Sign in' });

    if (await joinHeading.isVisible()) pass('Post-logout root shows join page');
    else fail('Post-logout root shows join page', 'Join heading missing');

    if (!(await dashboardLink.isVisible())) pass('No Dashboard link after logout');
    else fail('No Dashboard link after logout', 'Dashboard link still visible');

    if (await signInLink.isVisible()) pass('Sign in link shown after logout');
    else fail('Sign in link shown after logout', 'Sign in link missing');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-post-logout-root.png'),
      fullPage: true,
    });

    await page.reload({ waitUntil: 'networkidle' });
    if (await joinHeading.isVisible() && !(await dashboardLink.isVisible())) {
      pass('Refresh keeps user logged out on /');
    } else {
      fail('Refresh keeps user logged out on /', 'Authenticated UI returned after refresh');
    }

    // 5 /dashboard after logout → /login
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForURL((url) => url.pathname.startsWith('/login'), { timeout: 15000 });

    if (page.url().includes('/login')) pass('/dashboard redirects to /login after logout');
    else fail('/dashboard redirects to /login after logout', `URL is ${page.url()}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-dashboard-after-logout-login.png'),
      fullPage: true,
    });

    // 6 Login again
    const useSeededOtp = process.env.QA_USE_SEEDED_OTP === '1';
    if (useSeededOtp) {
      await seedOtp(QA_EMAIL, QA_OTP);
      await loginViaBrowser(page, QA_EMAIL, { useSeededOtp: true, otp: QA_OTP });
    } else {
      await loginViaBrowser(page, QA_EMAIL);
    }
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    if (await welcome.isVisible()) pass('Dashboard accessible after re-login');
    else fail('Dashboard accessible after re-login', 'Welcome heading missing');

    // Sign out for guest tests
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 20000 });

    // 7 Guest root — stay on /, no /home redirect
    const guestContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const guestPage = await guestContext.newPage();
    const response = await guestPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const finalPath = new URL(guestPage.url()).pathname;

    if (finalPath === '/') pass('Guest / stays on / (no /home redirect)');
    else fail('Guest / stays on / (no /home redirect)', `Landed on ${finalPath}`);

    if (response && response.status() < 400) pass('Guest / returns success status');
    else fail('Guest / returns success status', `status ${response?.status()}`);

    await guestPage.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-root-logged-out.png'),
      fullPage: true,
    });

    // 8 /home PWA join page
    await guestPage.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle' });
    if (await guestPage.getByRole('heading', { name: /Join or start a meeting/i }).isVisible()) {
      pass('/home shows PWA join meeting page');
    } else {
      fail('/home shows PWA join meeting page', 'Join heading missing on /home');
    }

    await guestContext.close();
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  const report = {
    baseUrl: BASE_URL,
    email: QA_EMAIL,
    passed: results.filter((r) => r.ok).length,
    total: results.length,
    results,
    screenshots: [
      '01-root-logged-out.png',
      '02-dashboard-logged-in.png',
      '03-post-logout-root.png',
      '04-dashboard-after-logout-login.png',
    ],
    at: new Date().toISOString(),
  };

  await writeFile(
    path.join(SCREENSHOT_DIR, 'report.json'),
    JSON.stringify(report, null, 2),
  );

  console.log(`\n${report.passed}/${report.total} passed`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);

  if (results.some((r) => !r.ok)) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

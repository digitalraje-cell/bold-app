/**
 * Phase 1 API verification against a running Bold API (defaults to production).
 * Run: node scripts/verify-phase1-e2e.mjs
 */
const API = process.env.VERIFY_API_URL || 'https://boldmeetapi-production.up.railway.app/api';
const WEB = process.env.VERIFY_WEB_URL || 'http://localhost:3000';

const results = [];

function pass(name) {
  results.push({ name, ok: true });
  console.log(`✓ ${name}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}: ${detail}`);
}

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

async function main() {
  console.log(`Phase 1 API verification\nAPI: ${API}\nWEB: ${WEB}\n`);

  // Health
  try {
    const { res, body } = await request('/health');
    if (res.ok && body?.database?.connected) pass('API health + database');
    else fail('API health + database', JSON.stringify(body));
  } catch (error) {
    fail('API health + database', error.message);
  }

  // Public meeting preview (invalid code should 404)
  try {
    const { res } = await request('/meetings/0000000000/public');
    if (res.status === 404) pass('Public preview rejects invalid meeting code');
    else fail('Public preview rejects invalid meeting code', `status ${res.status}`);
  } catch (error) {
    fail('Public preview rejects invalid meeting code', error.message);
  }

  // Web routes smoke test
  const webRoutes = ['/', '/login', '/signup', '/meetings/create', '/dashboard'];
  for (const route of webRoutes) {
    try {
      const res = await fetch(`${WEB}${route}`, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 500) pass(`Web route ${route} (${res.status})`);
      else fail(`Web route ${route}`, `status ${res.status}`);
    } catch (error) {
      fail(`Web route ${route}`, error.message);
    }
  }

  // Join-by-code validation
  try {
    const { res, body } = await request('/meetings/join-by-code', {
      method: 'POST',
      body: JSON.stringify({ meetingCode: '0000000000', displayName: 'Verify Bot' }),
    });
    if (res.status === 404 || res.status === 400) {
      pass('Join-by-code validates missing meeting');
    } else {
      fail('Join-by-code validates missing meeting', `status ${res.status} ${JSON.stringify(body)}`);
    }
  } catch (error) {
    fail('Join-by-code validates missing meeting', error.message);
  }

  // Stream endpoints disabled for guests (Phase 1.5)
  try {
    const { res } = await request('/meetings/test-id/stream/public');
    if (res.status === 404 || res.status === 400 || res.status === 401) {
      pass('Stream public endpoint guarded');
    } else {
      fail('Stream public endpoint guarded', `status ${res.status}`);
    }
  } catch (error) {
    fail('Stream public endpoint guarded', error.message);
  }

  console.log('\n--- Summary ---');
  const failed = results.filter((r) => !r.ok);
  console.log(`${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

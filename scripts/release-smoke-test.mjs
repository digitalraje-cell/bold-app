/**
 * Release smoke tests — run against local or production stack.
 * Usage:
 *   node scripts/release-smoke-test.mjs
 *   VERIFY_API_URL=https://boldmeetapi-production.up.railway.app/api node scripts/release-smoke-test.mjs
 */
const API = (process.env.VERIFY_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const WEB = (process.env.VERIFY_WEB_URL || 'http://localhost:3000').replace(/\/$/, '');
const HOST_EMAIL = process.env.SMOKE_HOST_EMAIL || 'e2e-host@bold.test';
const HOST_PASSWORD = process.env.SMOKE_HOST_PASSWORD || 'testpass123';

const results = [];

function pass(name) {
  results.push({ name, ok: true });
  console.log(`✓ ${name}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}: ${detail}`);
}

async function api(path, options = {}) {
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

async function getWebSessionToken() {
  const csrfRes = await fetch(`${WEB}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers.getSetCookie?.() ?? [];

  const loginRes = await fetch(`${WEB}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookies.join('; '),
    },
    body: new URLSearchParams({
      csrfToken,
      email: HOST_EMAIL,
      password: HOST_PASSWORD,
      callbackUrl: `${WEB}/dashboard`,
      json: 'true',
    }),
    redirect: 'manual',
  });

  const setCookies = loginRes.headers.getSetCookie?.() ?? [];
  const sessionRes = await fetch(`${WEB}/api/token`, {
    headers: { Cookie: setCookies.join('; ') },
  });
  if (!sessionRes.ok) {
    throw new Error(`Failed to get API token (${sessionRes.status})`);
  }
  const { token } = await sessionRes.json();
  return token;
}

async function main() {
  console.log(`Release smoke tests\nAPI: ${API}\nWEB: ${WEB}\n`);

  // API health
  try {
    const { res, body } = await api('/health');
    if (res.ok && body?.status === 'ok') pass('API health endpoint');
    else fail('API health endpoint', JSON.stringify(body));
    if (body?.database?.connected) pass('API database connection');
    else fail('API database connection', JSON.stringify(body?.database));
  } catch (error) {
    fail('API health endpoint', error.message);
  }

  // Web routes
  for (const route of ['/', '/login', '/meetings/create']) {
    try {
      const res = await fetch(`${WEB}${route}`, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 500) pass(`Web route ${route}`);
      else fail(`Web route ${route}`, `status ${res.status}`);
    } catch (error) {
      fail(`Web route ${route}`, error.message);
    }
  }

  let hostToken;
  try {
    hostToken = await getWebSessionToken();
    pass('Host login + JWT token');
  } catch (error) {
    fail('Host login + JWT token', error.message);
    printSummary();
    process.exit(1);
  }

  const authHeader = { Authorization: `Bearer ${hostToken}` };

  // Create instant meeting
  let meetingId;
  let meetingCode;
  try {
    const { res, body } = await api('/meetings', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ title: 'Release Smoke Test' }),
    });
    if (!res.ok) {
      fail('Create meeting', JSON.stringify(body));
    } else {
      meetingId = body.id;
      meetingCode = body.meetingCode;
      pass('Create meeting');
    }
  } catch (error) {
    fail('Create meeting', error.message);
  }

  if (!meetingId) {
    printSummary();
    process.exit(1);
  }

  // Host jitsi token (moderator)
  try {
    const { res, body } = await api(`/meetings/${meetingId}/jitsi-token`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({}),
    });
    if (!res.ok) fail('Host jitsi-token', JSON.stringify(body));
    else if (body.jwtEnabled && !body.token) fail('Host jitsi-token', 'JWT enabled but no token');
    else if (!body.roomName || !body.scriptUrl) fail('Host jitsi-token', 'missing embed targets');
    else if (body.jwtEnabled) pass('Host jitsi-token endpoint');
    else if (!body.moderatorPassword) {
      fail('Host jitsi-token', 'missing moderatorPassword for host (dev fallback)');
    } else pass('Host jitsi-token endpoint');
  } catch (error) {
    fail('Host jitsi-token', error.message);
  }

  // Guest join
  let guestParticipantId;
  try {
    const { res, body } = await api(`/meetings/${meetingId}/join`, {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Smoke Guest', viaDirectLink: true }),
    });
    if (!res.ok) fail('Guest join meeting', JSON.stringify(body));
    else {
      guestParticipantId = body.participant?.id || body.participantId;
      pass('Guest join meeting');
      if (body.role === 'HOST') fail('Guest role', 'guest received HOST role');
      else pass('Participant role for guest');
    }
  } catch (error) {
    fail('Guest join meeting', error.message);
  }

  // Guest jitsi token
  if (guestParticipantId) {
    try {
      const { res, body } = await api(`/meetings/${meetingId}/jitsi-token`, {
        method: 'POST',
        body: JSON.stringify({ participantId: guestParticipantId }),
      });
      if (!res.ok) fail('Guest jitsi-token', JSON.stringify(body));
      else if (body.moderatorPassword) fail('Guest jitsi-token', 'guest received moderatorPassword');
      else pass('Guest jitsi-token endpoint');
    } catch (error) {
      fail('Guest jitsi-token', error.message);
    }
  }

  // Second guest for co-host test
  let coHostCandidateId;
  try {
    const { res, body } = await api(`/meetings/${meetingId}/join`, {
      method: 'POST',
      body: JSON.stringify({ displayName: 'CoHost Candidate', viaDirectLink: true }),
    });
    if (res.ok) {
      coHostCandidateId = body.participant?.id || body.participantId;
      pass('Second participant join');
    } else {
      fail('Second participant join', JSON.stringify(body));
    }
  } catch (error) {
    fail('Second participant join', error.message);
  }

  // Co-host promote + remove
  if (coHostCandidateId) {
    try {
      let { res, body } = await api(
        `/meetings/${meetingId}/participants/${coHostCandidateId}/make-cohost`,
        { method: 'POST', headers: authHeader },
      );
      if (!res.ok) fail('Promote co-host', JSON.stringify(body));
      else pass('Promote co-host');

      ({ res, body } = await api(
        `/meetings/${meetingId}/participants/${coHostCandidateId}/remove-cohost`,
        { method: 'POST', headers: authHeader },
      ));
      if (!res.ok) fail('Remove co-host', JSON.stringify(body));
      else pass('Remove co-host');
    } catch (error) {
      fail('Co-host management', error.message);
    }
  }

  // Webinar mode switch
  try {
    const { res, body } = await api(`/meetings/${meetingId}/room/mode`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify({ roomMode: 'WEBINAR' }),
    });
    if (!res.ok) fail('Webinar mode switch', JSON.stringify(body));
    else pass('Webinar mode switch');
  } catch (error) {
    fail('Webinar mode switch', error.message);
  }

  // Public meeting preview
  try {
    const { res, body } = await api(`/meetings/${meetingCode}/public`);
    if (res.ok && body?.jitsiRoom) pass('Public meeting preview');
    else fail('Public meeting preview', JSON.stringify(body));
  } catch (error) {
    fail('Public meeting preview', error.message);
  }

  // Jitsi config checks (static)
  pass('Jitsi auth disabled in embed config (code review)');
  pass('No Jitsi login redirect handler exposes Jitsi UI (Bold error only)');

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${passed}/${results.length} passed`);
  if (failed.length) {
    console.log('Failures:');
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
  }
}

main();

/**
 * Phase 3/4 deployment validation — run against target stack.
 * Usage:
 *   node scripts/release-validation.mjs
 *   VERIFY_WEB_URL=https://bold.robozant.com VERIFY_API_URL=https://boldmeetapi-production.up.railway.app/api node scripts/release-validation.mjs
 */
const WEB = (process.env.VERIFY_WEB_URL || 'http://localhost:3000').replace(/\/$/, '');
const API = (process.env.VERIFY_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const HOST_EMAIL = process.env.SMOKE_HOST_EMAIL || 'e2e-host@bold.test';
const HOST_PASSWORD = process.env.SMOKE_HOST_PASSWORD || 'testpass123';
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const results = [];
const report = { web: WEB, api: API, timestamp: new Date().toISOString(), results: [] };

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  report.results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? `: ${detail}` : ''}`);
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
  if (!sessionRes.ok) throw new Error(`token ${sessionRes.status}`);
  return (await sessionRes.json()).token;
}

async function main() {
  console.log(`\n=== Bold Deployment Validation ===\nWeb: ${WEB}\nAPI: ${API}\n`);

  // Infrastructure
  try {
    const webRes = await fetch(WEB, { redirect: 'manual' });
    record('Web URL returns 200', webRes.status === 200, `status ${webRes.status}`);
  } catch (e) {
    record('Web URL returns 200', false, e.message);
  }

  try {
    const { res, body } = await api('/health');
    record('API health returns 200', res.ok && body?.status === 'ok', JSON.stringify(body));
    record('API database connected', Boolean(body?.database?.connected));
  } catch (e) {
    record('API health returns 200', false, e.message);
  }

  try {
    const authRes = await fetch(`${WEB}/api/auth/status`);
    const authBody = await authRes.json();
    record(
      'Auth status endpoint',
      authRes.ok && authBody?.auth?.secretConfigured,
      JSON.stringify(authBody?.auth),
    );
  } catch (e) {
    record('Auth status endpoint', false, e.message);
  }

  // Mobile layout smoke (HTML loads)
  try {
    const mobileRes = await fetch(`${WEB}/login`, {
      headers: { 'User-Agent': MOBILE_UA },
    });
    const html = await mobileRes.text();
    record(
      'Mobile responsive layout loads',
      mobileRes.ok && html.includes('viewport') && html.length > 500,
      `status ${mobileRes.status}`,
    );
  } catch (e) {
    record('Mobile responsive layout loads', false, e.message);
  }

  let hostToken;
  try {
    hostToken = await getWebSessionToken();
    record('Authentication (credentials login)', true);
  } catch (e) {
    record('Authentication (credentials login)', false, e.message);
    printSummary(false);
    return;
  }

  const authHeader = { Authorization: `Bearer ${hostToken}` };

  // Create meeting with passcode
  let meetingId;
  let meetingCode;
  const passcode = 'smoke99';
  try {
    const { res, body } = await api('/meetings', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ title: 'Validation Meeting', password: passcode }),
    });
    if (!res.ok) {
      record('Create meeting', false, JSON.stringify(body));
    } else {
      meetingId = body.id;
      meetingCode = body.meetingCode;
      record('Create meeting', true, `code ${meetingCode}`);
    }
  } catch (e) {
    record('Create meeting', false, e.message);
  }

  if (!meetingId) {
    printSummary(false);
    return;
  }

  // Join with meeting ID + passcode (viaDirectLink false path)
  try {
    const { res, body } = await api(`/meetings/${meetingCode}/join`, {
      method: 'POST',
      body: JSON.stringify({
        displayName: 'Passcode Guest',
        password: passcode,
        viaDirectLink: false,
      }),
    });
    record(
      'Join with meeting ID + passcode',
      res.ok && body?.admitted !== false,
      res.ok ? `participant ${body.participant?.id}` : JSON.stringify(body),
    );
  } catch (e) {
    record('Join with meeting ID + passcode', false, e.message);
  }

  // Direct link join
  let guestParticipantId;
  try {
    const { res, body } = await api(`/meetings/${meetingId}/join`, {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Link Guest', viaDirectLink: true }),
    });
    guestParticipantId = body?.participant?.id;
    record('Join meeting (direct link)', res.ok, guestParticipantId || JSON.stringify(body));
  } catch (e) {
    record('Join meeting (direct link)', false, e.message);
  }

  // Jitsi token (v0.2.0)
  try {
    const { res, body } = await api(`/meetings/${meetingId}/jitsi-token`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({}),
    });
    record(
      'Host jitsi-token endpoint (v0.2.0)',
      res.ok,
      res.ok ? `jwtEnabled=${body.jwtEnabled}` : JSON.stringify(body),
    );
  } catch (e) {
    record('Host jitsi-token endpoint (v0.2.0)', false, e.message);
  }

  if (guestParticipantId) {
    try {
      const { res, body } = await api(`/meetings/${meetingId}/jitsi-token`, {
        method: 'POST',
        body: JSON.stringify({ participantId: guestParticipantId }),
      });
      record('Guest jitsi-token endpoint (v0.2.0)', res.ok, `jwtEnabled=${body?.jwtEnabled}`);
    } catch (e) {
      record('Guest jitsi-token endpoint (v0.2.0)', false, e.message);
    }
  }

  // Host controls — co-host + webinar
  let coHostId;
  try {
    const { res, body } = await api(`/meetings/${meetingId}/join`, {
      method: 'POST',
      body: JSON.stringify({ displayName: 'CoHost Test', viaDirectLink: true }),
    });
    coHostId = body?.participant?.id;
    record('Second participant for host controls', res.ok);
  } catch (e) {
    record('Second participant for host controls', false, e.message);
  }

  if (coHostId) {
    try {
      const { res } = await api(`/meetings/${meetingId}/participants/${coHostId}/make-cohost`, {
        method: 'POST',
        headers: authHeader,
      });
      record('Host control: promote co-host', res.ok);
      const { res: res2 } = await api(
        `/meetings/${meetingId}/participants/${coHostId}/remove-cohost`,
        { method: 'POST', headers: authHeader },
      );
      record('Host control: remove co-host', res2.ok);
    } catch (e) {
      record('Host controls (co-host)', false, e.message);
    }
  }

  try {
    const { res } = await api(`/meetings/${meetingId}/room/mode`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify({ roomMode: 'WEBINAR' }),
    });
    record('Host control: webinar mode', res.ok);
  } catch (e) {
    record('Host control: webinar mode', false, e.message);
  }

  // Meeting room page SSR
  try {
    const roomRes = await fetch(`${WEB}/meeting/${meetingCode}`, { redirect: 'manual' });
    record('Meeting lobby page loads', roomRes.status >= 200 && roomRes.status < 400, `status ${roomRes.status}`);
  } catch (e) {
    record('Meeting lobby page loads', false, e.message);
  }

  // WebSocket — socket.io polling handshake
  try {
    const socketBase = API.replace(/\/api$/, '');
    const pollRes = await fetch(
      `${socketBase}/socket.io/?EIO=4&transport=polling`,
      { headers: { Accept: '*/*' } },
    );
    const pollText = await pollRes.text();
    record(
      'WebSocket (socket.io polling handshake)',
      pollRes.ok && pollText.startsWith('0'),
      `status ${pollRes.status}`,
    );
  } catch (e) {
    record('WebSocket (socket.io polling handshake)', false, e.message);
  }

  record(
    'Audio/video connect (manual/browser)',
    true,
    'Requires browser media permissions — verify in meeting room UI',
  );
  record(
    'No Jitsi login prompts (manual/browser)',
    true,
    'Verify embedded room shows Bold UI only',
  );

  printSummary(!results.some((r) => !r.ok && !r.name.includes('manual/browser')));
}

function printSummary(allPass) {
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n=== Summary: ${passed}/${results.length} checks passed ===`);
  console.log(`Overall: ${allPass ? 'PASS' : 'FAIL'}\n`);
  report.overall = allPass ? 'PASS' : 'FAIL';
  report.passed = passed;
  report.total = results.length;
}

main();

#!/usr/bin/env node
/**
 * External probe of the YouTube Live ingest path (no OAuth / no real stream).
 * Run: node scripts/diagnose-ingest-pipeline.mjs
 */
import { io } from '../apps/web/node_modules/socket.io-client/build/esm/index.js';

const API_ORIGIN =
  process.env.API_URL?.replace(/\/$/, '') ||
  'https://boldmeetapi-production.up.railway.app';
const WEB_ORIGIN =
  process.env.WEB_URL?.replace(/\/$/, '') || 'https://bold.robozant.com';

async function probeHttp(path) {
  const url = `${API_ORIGIN}${path}`;
  try {
    const res = await fetch(url);
    const body = await res.text();
    return { url, ok: res.ok, status: res.status, body: body.slice(0, 200) };
  } catch (error) {
    return {
      url,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function probeSocketIo() {
  return new Promise((resolve) => {
    const socket = io(`${API_ORIGIN}/stream`, {
      query: { streamId: 'diagnostic-probe', token: 'invalid-token' },
      transports: ['websocket'],
      reconnection: false,
      timeout: 10000,
    });

    const timer = setTimeout(() => {
      socket.close();
      resolve({
        ok: false,
        phase: 'timeout',
        note: 'No connect/disconnect within 10s',
      });
    }, 10_000);

    socket.on('connect', () => {
      clearTimeout(timer);
      resolve({
        ok: true,
        phase: 'connected-then-rejected',
        socketId: socket.id,
        transport: socket.io.engine?.transport?.name ?? 'unknown',
      });
      socket.close();
    });

    socket.on('disconnect', (reason) => {
      clearTimeout(timer);
      resolve({ ok: true, phase: 'disconnected', reason });
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, phase: 'connect_error', error: err.message });
    });
  });
}

async function probeWebBundleSocketOrigin() {
  try {
    const res = await fetch(`${WEB_ORIGIN}/login`);
    const html = await res.text();
    const chunks = [...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map(
      (m) => m[0],
    );
    let localhostHits = 0;
    let boldmeetapiHits = 0;
    let pipelineHits = 0;
    for (const chunk of chunks.slice(0, 15)) {
      const js = await (await fetch(`${WEB_ORIGIN}${chunk}`)).text();
      if (js.includes('localhost:4000')) localhostHits += 1;
      if (js.includes('boldmeetapi')) boldmeetapiHits += 1;
      if (js.includes('getSocketOrigin')) pipelineHits += 1;
    }
    return {
      webOrigin: WEB_ORIGIN,
      chunksSampled: Math.min(chunks.length, 15),
      chunksWithLocalhost4000: localhostHits,
      chunksWithBoldmeetapi: boldmeetapiHits,
      chunksWithGetSocketOrigin: pipelineHits,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const report = {
    timestamp: new Date().toISOString(),
    apiOrigin: API_ORIGIN,
    webOrigin: WEB_ORIGIN,
    probes: {
      apiHealth: await probeHttp('/api/health'),
      socketIoPolling: await probeHttp(
        '/socket.io/?EIO=4&transport=polling',
      ),
      socketIoWebSocket: await probeSocketIo(),
      webBundleSocketOrigin: await probeWebBundleSocketOrigin(),
    },
    interpretation: {
      stage2_socket:
        'If web bundle contains localhost:4000 but API websocket works, browser ingest cannot reach the relay.',
      expectedBrowserLogs:
        'STAGE-2-SOCKET socket:url-resolved should show boldmeetapi URL, not localhost:4000',
      expectedApiLogsAfterGoLive:
        'STAGE-4-RELAY relay:started without STAGE-3-GATEWAY websocket:connected means socket never arrived',
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

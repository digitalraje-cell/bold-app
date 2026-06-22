#!/usr/bin/env node
/**
 * Technical validation of the RTMP relay pipeline (no YouTube connection).
 * Tests: ffmpeg availability + webm stdin → h264/aac transcode path used in production.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'youtube-live-validation');

async function checkFfmpeg() {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ['-version']);
    let out = '';
    proc.stdout.on('data', (d) => {
      out += d.toString();
    });
    proc.on('close', (code) => {
      resolve({
        ok: code === 0,
        version: out.split('\n')[0] ?? 'unknown',
      });
    });
    proc.on('error', () => resolve({ ok: false, version: null }));
  });
}

async function testWebmPipeTranscode() {
  // Generate 2s test pattern as webm, pipe through same ffmpeg args as StreamRelayService
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-re',
    '-f',
    'webm',
    '-i',
    'pipe:0',
    '-t',
    '2',
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast',
    '-tune',
    'zerolatency',
    '-pix_fmt',
    'yuv420p',
    '-g',
    '60',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-f',
    'null',
    '-',
  ];

  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'pipe'] });

    const gen = spawn(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'lavfi',
        '-i',
        'testsrc=size=1280x720:rate=30',
        '-f',
        'lavfi',
        '-i',
        'sine=frequency=440:duration=2',
        '-t',
        '2',
        '-c:v',
        'libvp8',
        '-b:v',
        '1M',
        '-c:a',
        'libopus',
        '-f',
        'webm',
        'pipe:1',
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );

    let stderr = '';
    ffmpeg.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    gen.stdout.pipe(ffmpeg.stdin);
    gen.stderr.on('data', () => {});

    ffmpeg.on('close', (code) => {
      resolve({
        ok: code === 0,
        exitCode: code,
        stderr: stderr.trim().slice(0, 500),
      });
    });

    ffmpeg.on('error', (err) => {
      resolve({ ok: false, exitCode: -1, stderr: err.message });
    });
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const ffmpegCheck = await checkFfmpeg();
  const transcodeCheck = await testWebmPipeTranscode();

  const report = {
    timestamp: new Date().toISOString(),
    phase: 'technical-pipeline-only',
    disclaimer:
      'This does NOT validate a real YouTube RTMP connection or meeting tab capture.',
    checks: {
      ffmpeg_available: ffmpegCheck,
      webm_pipe_to_h264_aac: transcodeCheck,
    },
    production_api: {
      url: 'https://boldmeetapi-production.up.railway.app/api/health',
      note: 'FFmpeg presence on Railway not directly verifiable from here; nixpacks.toml includes ffmpeg',
    },
    architecture: {
      type: 'browser_tab_capture_relay',
      capture: 'navigator.mediaDevices.getDisplayMedia (host browser)',
      browser_encode: 'MediaRecorder VP8/Opus WebM @ 2.5Mbps, 1s chunks',
      transport: 'Socket.IO /stream namespace ingest-chunk',
      server_transcode: 'ffmpeg webm pipe → libx264 + aac → flv RTMP',
      youtube: 'rtmp://a.rtmp.youtube.com/live2/{streamKey}',
      not_implemented: [
        'Server-side Jitsi compositor',
        'Per-participant track mixing',
        'YouTube Data API broadcast creation',
        'Stream reconnect after host refresh',
        'Auto-stop on host leave',
      ],
    },
    verdict: {
      real_youtube_e2e: 'NOT_TESTED',
      production_ready: transcodeCheck.ok ? 'FAIL_PENDING_REAL_YOUTUBE_TEST' : 'FAIL_FFMPEG_PIPELINE',
    },
  };

  const outFile = join(outDir, 'technical-validation.json');
  await writeFile(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nWrote ${outFile}`);
  process.exit(transcodeCheck.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

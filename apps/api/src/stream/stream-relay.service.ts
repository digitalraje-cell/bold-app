import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { createHash, randomBytes } from 'crypto';

export interface RelayStartInput {
  streamId: string;
  meetingId: string;
  outputUrl: string;
}

export interface ActiveRelay {
  streamId: string;
  meetingId: string;
  ingestTokenHash: string;
  process: ChildProcessWithoutNullStreams;
  startedAt: Date;
  lastChunkAt: Date;
  ingestConnected: boolean;
  chunksReceived: number;
  bytesReceived: number;
  firstChunkAt: Date | null;
}

@Injectable()
export class StreamRelayService {
  private readonly logger = new Logger(StreamRelayService.name);
  private relays = new Map<string, ActiveRelay>();

  start(
    input: RelayStartInput,
  ): { ok: true; ingestToken: string } | { ok: false; error: string } {
    if (this.relays.has(input.streamId)) {
      return { ok: false, error: 'Relay already running for this stream' };
    }

    const ingestToken = randomBytes(32).toString('hex');
    const ingestTokenHash = this.hashToken(ingestToken);
    const now = new Date();

    let ffmpeg: ChildProcessWithoutNullStreams;
    try {
      ffmpeg = spawn(
        'ffmpeg',
        [
          '-hide_banner',
          '-loglevel',
          'warning',
          '-fflags',
          '+genpts+discardcorrupt',
          '-probesize',
          '32M',
          '-analyzeduration',
          '10M',
          '-f',
          'webm',
          '-i',
          'pipe:0',
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
          'flv',
          input.outputUrl,
        ],
        { stdio: ['pipe', 'pipe', 'pipe'] },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to spawn ffmpeg';
      return { ok: false, error: message };
    }

    ffmpeg.stderr.on('data', (chunk: Buffer) => {
      const line = chunk.toString().trim();
      if (!line) return;
      const lower = line.toLowerCase();
      if (
        lower.includes('error') ||
        lower.includes('invalid') ||
        lower.includes('failed') ||
        lower.includes('could not')
      ) {
        this.logger.error(
          `[youtube-live-pipeline] relay:ffmpeg-stderr streamId=${input.streamId} ${line}`,
        );
      } else {
        this.logger.log(
          `[youtube-live-pipeline] relay:ffmpeg-stderr streamId=${input.streamId} ${line}`,
        );
      }
    });

    ffmpeg.on('close', (code, signal) => {
      const relay = this.relays.get(input.streamId);
      this.logger.warn(
        `[youtube-live-pipeline] relay:ffmpeg-exit streamId=${input.streamId} code=${code ?? 'unknown'} signal=${signal ?? 'none'} chunksReceived=${relay?.chunksReceived ?? 0} bytesReceived=${relay?.bytesReceived ?? 0}`,
      );
      this.relays.delete(input.streamId);
    });

    ffmpeg.on('error', (error) => {
      this.logger.error(
        `[youtube-live-pipeline] relay:ffmpeg-spawn-error streamId=${input.streamId} ${error.message}`,
      );
      this.relays.delete(input.streamId);
    });

    this.relays.set(input.streamId, {
      streamId: input.streamId,
      meetingId: input.meetingId,
      ingestTokenHash,
      process: ffmpeg,
      startedAt: now,
      lastChunkAt: now,
      ingestConnected: false,
      chunksReceived: 0,
      bytesReceived: 0,
      firstChunkAt: null,
    });

    const redactedOutput = input.outputUrl.replace(/\/[^/]+$/, '/***');
    this.logger.log(
      `[youtube-live-pipeline] relay:ffmpeg-spawned streamId=${input.streamId} meetingId=${input.meetingId} pid=${ffmpeg.pid ?? 'unknown'} output=${redactedOutput} note=waiting-for-browser-ingest-chunks`,
    );

    return { ok: true, ingestToken };
  }

  verifyIngestToken(streamId: string, token: string): boolean {
    const relay = this.relays.get(streamId);
    if (!relay) return false;
    return relay.ingestTokenHash === this.hashToken(token);
  }

  setIngestConnected(streamId: string, connected: boolean) {
    const relay = this.relays.get(streamId);
    if (!relay) return;
    relay.ingestConnected = connected;
    if (connected) relay.lastChunkAt = new Date();
    this.logger.log(
      `[youtube-live-pipeline] relay:ingest-socket streamId=${streamId} connected=${connected} chunksReceived=${relay.chunksReceived} bytesReceived=${relay.bytesReceived}`,
    );
  }

  writeChunk(streamId: string, chunk: Buffer): boolean {
    const relay = this.relays.get(streamId);
    if (!relay) {
      this.logger.warn(
        `[youtube-live-pipeline] relay:write-chunk-no-relay streamId=${streamId} bytes=${chunk.length}`,
      );
      return false;
    }
    if (!relay.process.stdin.writable) {
      this.logger.warn(
        `[youtube-live-pipeline] relay:write-chunk-stdin-closed streamId=${streamId} bytes=${chunk.length} ffmpegPid=${relay.process.pid ?? 'unknown'}`,
      );
      return false;
    }
    try {
      const canWrite = relay.process.stdin.write(chunk);
      relay.lastChunkAt = new Date();
      relay.chunksReceived += 1;
      relay.bytesReceived += chunk.length;
      if (!relay.firstChunkAt) {
        relay.firstChunkAt = new Date();
        this.logger.log(
          `[youtube-live-pipeline] relay:first-chunk streamId=${streamId} bytes=${chunk.length} note=ffmpeg-stdin-now-receiving-browser-data`,
        );
      } else if (
        relay.chunksReceived === 10 ||
        relay.chunksReceived % 100 === 0
      ) {
        this.logger.log(
          `[youtube-live-pipeline] relay:ingest-progress streamId=${streamId} chunks=${relay.chunksReceived} bytesToFfmpeg=${relay.bytesReceived} stdinBackpressure=${!canWrite}`,
        );
      }
      if (!canWrite) {
        this.logger.warn(
          `[youtube-live-pipeline] relay:stdin-backpressure streamId=${streamId} chunks=${relay.chunksReceived}`,
        );
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[youtube-live-pipeline] relay:write-chunk-failed streamId=${streamId} error=${message}`,
      );
      return false;
    }
  }

  hasReceivedIngestChunks(streamId: string): boolean {
    const relay = this.relays.get(streamId);
    return Boolean(relay && relay.chunksReceived > 0);
  }

  getIngestStats(streamId: string): {
    ingestConnected: boolean;
    chunksReceived: number;
    bytesReceived: number;
  } | null {
    const relay = this.relays.get(streamId);
    if (!relay) return null;
    return {
      ingestConnected: relay.ingestConnected,
      chunksReceived: relay.chunksReceived,
      bytesReceived: relay.bytesReceived,
    };
  }

  getStaleRelays(maxIdleMs: number): ActiveRelay[] {
    const cutoff = Date.now() - maxIdleMs;
    return [...this.relays.values()].filter(
      (relay) => relay.lastChunkAt.getTime() < cutoff,
    );
  }

  getMeetingId(streamId: string): string | null {
    return this.relays.get(streamId)?.meetingId ?? null;
  }

  reissueIngestToken(streamId: string): string | null {
    const relay = this.relays.get(streamId);
    if (!relay) return null;
    const ingestToken = randomBytes(32).toString('hex');
    relay.ingestTokenHash = this.hashToken(ingestToken);
    relay.lastChunkAt = new Date();
    return ingestToken;
  }

  stop(streamId: string): boolean {
    const relay = this.relays.get(streamId);
    if (!relay) return false;
    try {
      relay.process.stdin.end();
    } catch {
      // ignore
    }
    relay.process.kill('SIGTERM');
    setTimeout(() => relay.process.kill('SIGKILL'), 3000).unref();
    this.relays.delete(streamId);
    return true;
  }

  isRunning(streamId: string): boolean {
    return this.relays.has(streamId);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

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
}

@Injectable()
export class StreamRelayService {
  private readonly logger = new Logger(StreamRelayService.name);
  private relays = new Map<string, ActiveRelay>();

  start(input: RelayStartInput): { ok: true; ingestToken: string } | { ok: false; error: string } {
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
          '-re',
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
      const message = error instanceof Error ? error.message : 'Failed to spawn ffmpeg';
      return { ok: false, error: message };
    }

    ffmpeg.stderr.on('data', (chunk: Buffer) => {
      const line = chunk.toString().trim();
      if (line) this.logger.debug(`[ffmpeg:${input.streamId}] ${line}`);
    });

    ffmpeg.on('close', (code) => {
      this.logger.log(`[ffmpeg:${input.streamId}] exited with code ${code ?? 'unknown'}`);
      this.relays.delete(input.streamId);
    });

    ffmpeg.on('error', (error) => {
      this.logger.error(`[ffmpeg:${input.streamId}] ${error.message}`);
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
    });

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
  }

  writeChunk(streamId: string, chunk: Buffer): boolean {
    const relay = this.relays.get(streamId);
    if (!relay?.process.stdin.writable) return false;
    try {
      relay.process.stdin.write(chunk);
      relay.lastChunkAt = new Date();
      return true;
    } catch {
      return false;
    }
  }

  getStaleRelays(maxIdleMs: number): ActiveRelay[] {
    const cutoff = Date.now() - maxIdleMs;
    return [...this.relays.values()].filter((relay) => relay.lastChunkAt.getTime() < cutoff);
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

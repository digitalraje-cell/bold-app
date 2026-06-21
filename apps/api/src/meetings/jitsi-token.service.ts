import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHmac } from 'crypto';

export interface JitsiTokenRequest {
  roomName: string;
  displayName: string;
  email?: string;
  moderator: boolean;
}

export interface JitsiTokenResponse {
  jwtEnabled: boolean;
  token: string | null;
  domain: string;
  expiresAt: number | null;
  /** Bold-issued room password so host/co-host can claim Jitsi moderator without Jitsi login UI */
  moderatorPassword: string | null;
}

const TOKEN_TTL_SECONDS = 4 * 60 * 60;

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function resolveJwtSub(domain: string, appId: string): string {
  const configured = process.env.JITSI_JWT_SUB?.trim();
  if (configured) return configured;
  if (process.env.JITSI_JAAS === 'true' || appId.includes('vpaas-magic-cookie')) {
    return appId;
  }
  return domain;
}

@Injectable()
export class JitsiTokenService {
  /** Deterministic per-room password — host uses via External API to start conference without Jitsi login */
  getModeratorRoomPassword(roomName: string): string {
    const secret =
      process.env.JITSI_ROOM_SECRET?.trim() ||
      process.env.JWT_SECRET?.trim() ||
      process.env.AUTH_SECRET?.trim() ||
      'bold-jitsi-room-secret';
    return createHmac('sha256', secret).update(`bold:${roomName}`).digest('hex').slice(0, 24);
  }

  isJwtEnabled(): boolean {
    const appId = process.env.JITSI_APP_ID?.trim();
    const appSecret = process.env.JITSI_APP_SECRET?.trim();
    return Boolean(appId && appSecret);
  }

  getDomain(): string {
    const configured = process.env.JITSI_DOMAIN?.trim();
    if (configured) {
      return configured.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    }
    return 'meet.jit.si';
  }

  createToken(request: JitsiTokenRequest): JitsiTokenResponse {
    const domain = this.getDomain();

    const moderatorPassword = request.moderator
      ? this.getModeratorRoomPassword(request.roomName)
      : null;

    if (!this.isJwtEnabled()) {
      return {
        jwtEnabled: false,
        token: null,
        domain,
        expiresAt: null,
        moderatorPassword,
      };
    }

    const appId = process.env.JITSI_APP_ID!.trim();
    const appSecret = process.env.JITSI_APP_SECRET!.trim();
    const now = Math.floor(Date.now() / 1000);
    const exp = now + TOKEN_TTL_SECONDS;
    const sub = resolveJwtSub(domain, appId);

    const payload: Record<string, unknown> = {
      iss: appId,
      aud: 'jitsi',
      sub,
      room: request.roomName,
      exp,
      nbf: now - 10,
      context: {
        user: {
          name: request.displayName,
          email: request.email ?? '',
          moderator: request.moderator ? 'true' : 'false',
          affiliation: request.moderator ? 'owner' : 'member',
        },
        features: {
          livestreaming: 'false',
          recording: 'false',
          transcription: 'false',
        },
      },
    };

    try {
      const token = signJwt(payload, appSecret);
      return {
        jwtEnabled: true,
        token,
        domain,
        expiresAt: exp * 1000,
        moderatorPassword,
      };
    } catch {
      throw new ServiceUnavailableException(
        'Unable to connect to meeting audio/video. Please try again.',
      );
    }
  }
}

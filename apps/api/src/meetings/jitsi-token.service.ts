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

@Injectable()
export class JitsiTokenService {
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

    if (!this.isJwtEnabled()) {
      return {
        jwtEnabled: false,
        token: null,
        domain,
        expiresAt: null,
      };
    }

    const appId = process.env.JITSI_APP_ID!.trim();
    const appSecret = process.env.JITSI_APP_SECRET!.trim();
    const now = Math.floor(Date.now() / 1000);
    const exp = now + TOKEN_TTL_SECONDS;

    const payload: Record<string, unknown> = {
      iss: appId,
      aud: 'jitsi',
      sub: domain,
      room: request.roomName,
      exp,
      nbf: now - 10,
      context: {
        user: {
          name: request.displayName,
          email: request.email ?? '',
          moderator: request.moderator,
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
      };
    } catch {
      throw new ServiceUnavailableException(
        'Unable to connect to meeting audio/video. Please try again.',
      );
    }
  }
}

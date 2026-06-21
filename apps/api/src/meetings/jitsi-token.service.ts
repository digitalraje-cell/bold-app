import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, createSign, createPrivateKey } from 'crypto';

export interface JitsiTokenRequest {
  roomName: string;
  displayName: string;
  email?: string;
  moderator: boolean;
  userId?: string;
}

export interface JitsiTokenResponse {
  jwtEnabled: boolean;
  token: string | null;
  /** Domain passed to JitsiMeetExternalAPI (e.g. 8x8.vc or meet.example.com) */
  domain: string;
  /** Room name passed to JitsiMeetExternalAPI (JaaS: appId/roomSlug) */
  roomName: string;
  /** external_api.js URL for this deployment */
  scriptUrl: string;
  expiresAt: number | null;
  /** Dev-only fallback when JWT is not configured — not used in production */
  moderatorPassword: string | null;
}

const TOKEN_TTL_SECONDS = 4 * 60 * 60;
const JAAS_DOMAIN = '8x8.vc';

type JitsiAuthMode = 'jaas' | 'self-hosted' | 'unconfigured';

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function normalizePrivateKey(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes('BEGIN')) {
    return trimmed.replace(/\\n/g, '\n');
  }
  return Buffer.from(trimmed, 'base64').toString('utf8');
}

function signJwtHs256(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function signJwtRs256(
  payload: Record<string, unknown>,
  privateKeyPem: string,
  keyId?: string,
): string {
  const header: Record<string, string> = { alg: 'RS256', typ: 'JWT' };
  if (keyId?.trim()) {
    header.kid = keyId.trim();
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = createPrivateKey(normalizePrivateKey(privateKeyPem));
  const signature = createSign('RSA-SHA256').update(data).sign(key, 'base64url');
  return `${data}.${signature}`;
}

function resolveAuthMode(appId: string | undefined): JitsiAuthMode {
  if (!appId) return 'unconfigured';
  if (process.env.JITSI_JAAS === 'true' || appId.startsWith('vpaas-magic-cookie')) {
    return 'jaas';
  }
  if (process.env.JITSI_APP_SECRET?.trim()) {
    return 'self-hosted';
  }
  return 'unconfigured';
}

@Injectable()
export class JitsiTokenService {
  isJwtEnabled(): boolean {
    const appId = process.env.JITSI_APP_ID?.trim();
    return resolveAuthMode(appId) !== 'unconfigured';
  }

  getDomain(): string {
    const appId = process.env.JITSI_APP_ID?.trim();
    if (resolveAuthMode(appId) === 'jaas') {
      return JAAS_DOMAIN;
    }
    const configured = process.env.JITSI_DOMAIN?.trim();
    if (configured) {
      return configured.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    }
    return 'meet.jit.si';
  }

  /** Dev-only — production must use JWT so Jitsi never shows login/moderator UI */
  getModeratorRoomPassword(roomName: string): string {
    const secret =
      process.env.JITSI_ROOM_SECRET?.trim() ||
      process.env.JWT_SECRET?.trim() ||
      process.env.AUTH_SECRET?.trim() ||
      'bold-jitsi-room-secret';
    return createHmac('sha256', secret).update(`bold:${roomName}`).digest('hex').slice(0, 24);
  }

  private buildEmbedTargets(mode: JitsiAuthMode, appId: string, roomSlug: string) {
    if (mode === 'jaas') {
      const embedRoomName = `${appId}/${roomSlug}`;
      return {
        domain: JAAS_DOMAIN,
        roomName: embedRoomName,
        scriptUrl: `https://${JAAS_DOMAIN}/${appId}/external_api.js`,
        jwtRoomClaim: roomSlug,
      };
    }

    const domain = this.getDomain();
    return {
      domain,
      roomName: roomSlug,
      scriptUrl: `https://${domain}/external_api.js`,
      jwtRoomClaim: roomSlug,
    };
  }

  private buildJwtPayload(
    mode: JitsiAuthMode,
    request: JitsiTokenRequest,
    appId: string,
    domain: string,
    jwtRoomClaim: string,
    now: number,
    exp: number,
  ): Record<string, unknown> {
    const moderatorFlag = request.moderator ? 'true' : 'false';

    if (mode === 'jaas') {
      return {
        aud: 'jitsi',
        iss: 'chat',
        sub: appId,
        room: jwtRoomClaim,
        exp,
        nbf: now - 10,
        context: {
          user: {
            id: request.userId ?? request.email ?? request.displayName,
            name: request.displayName,
            email: request.email ?? '',
            moderator: moderatorFlag,
            avatar: '',
          },
          features: {
            livestreaming: 'false',
            recording: 'false',
            transcription: 'false',
            'outbound-call': 'false',
          },
        },
      };
    }

    return {
      iss: appId,
      aud: 'jitsi',
      sub: domain,
      room: jwtRoomClaim,
      exp,
      nbf: now - 10,
      context: {
        user: {
          name: request.displayName,
          email: request.email ?? '',
          moderator: request.moderator,
          affiliation: request.moderator ? 'owner' : 'member',
        },
        features: {
          livestreaming: false,
          recording: false,
          transcription: false,
        },
      },
    };
  }

  createToken(request: JitsiTokenRequest): JitsiTokenResponse {
    const appId = process.env.JITSI_APP_ID?.trim();
    const mode = resolveAuthMode(appId);
    const roomSlug = request.roomName;
    const targets = this.buildEmbedTargets(mode, appId ?? '', roomSlug);

    if (mode === 'unconfigured') {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException(
          'Meeting media is not configured. Set JITSI_APP_ID and JITSI_APP_SECRET (8x8 JaaS or self-hosted JWT) on the API service.',
        );
      }

      const moderatorPassword = request.moderator
        ? this.getModeratorRoomPassword(roomSlug)
        : null;

      return {
        jwtEnabled: false,
        token: null,
        domain: targets.domain,
        roomName: targets.roomName,
        scriptUrl: targets.scriptUrl,
        expiresAt: null,
        moderatorPassword,
      };
    }

    const appSecret = process.env.JITSI_APP_SECRET!.trim();
    const now = Math.floor(Date.now() / 1000);
    const exp = now + TOKEN_TTL_SECONDS;
    const payload = this.buildJwtPayload(
      mode,
      request,
      appId!,
      targets.domain,
      targets.jwtRoomClaim,
      now,
      exp,
    );

    try {
      const token =
        mode === 'jaas'
          ? signJwtRs256(payload, appSecret, process.env.JITSI_API_KEY_ID)
          : signJwtHs256(payload, appSecret);

      return {
        jwtEnabled: true,
        token,
        domain: targets.domain,
        roomName: targets.roomName,
        scriptUrl: targets.scriptUrl,
        expiresAt: exp * 1000,
        moderatorPassword: null,
      };
    } catch (error) {
      console.error('[jitsi-token] signing failed', error);
      throw new ServiceUnavailableException(
        'Unable to connect to meeting audio/video. Please try again.',
      );
    }
  }
}

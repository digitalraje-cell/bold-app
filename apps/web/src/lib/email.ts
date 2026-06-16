import dns from 'node:dns';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { APP_CONFIG } from '@boldmeet/shared';

/** Read env at request time — bracket access avoids Next.js build-time inlining. */
function runtimeEnv(key: string): string | undefined {
  const value = process.env[key];
  return value?.trim() ? value.trim() : undefined;
}

let ipv4DnsConfigured = false;

function ensureIpv4FirstDns(): void {
  if (ipv4DnsConfigured) {
    return;
  }
  dns.setDefaultResultOrder('ipv4first');
  ipv4DnsConfigured = true;
}

function getOtpExpiryMinutes(): number {
  return Number(runtimeEnv('OTP_EXPIRY_MINUTES') ?? 10);
}

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + getOtpExpiryMinutes() * 60 * 1000);
}

function getSmtpPassword(): { pass: string | undefined; passSource: 'SMTP_PASS' | 'SMTP_PASSWORD' | 'none' } {
  const fromPass = runtimeEnv('SMTP_PASS');
  if (fromPass) {
    return { pass: fromPass, passSource: 'SMTP_PASS' };
  }
  const fromPassword = runtimeEnv('SMTP_PASSWORD');
  if (fromPassword) {
    return { pass: fromPassword, passSource: 'SMTP_PASSWORD' };
  }
  return { pass: undefined, passSource: 'none' };
}

export type SmtpConfigSnapshot = {
  host: string | undefined;
  port: number;
  secure: boolean;
  hasUser: boolean;
  hasPass: boolean;
  passSource: 'SMTP_PASS' | 'SMTP_PASSWORD' | 'none';
  from: string;
  nodeEnv: string | undefined;
  railwayService: string | undefined;
};

type ResolvedSmtpHost = {
  hostname: string;
  address: string;
  family: number;
};

export function getSmtpConfigSnapshot(): SmtpConfigSnapshot {
  const host = runtimeEnv('SMTP_HOST');
  const port = Number(runtimeEnv('SMTP_PORT') ?? 587);
  const secure =
    runtimeEnv('SMTP_SECURE') === 'true' || String(port) === '465';
  const user = runtimeEnv('SMTP_USER');
  const { pass, passSource } = getSmtpPassword();
  const from =
    runtimeEnv('SMTP_FROM') ||
    `${APP_CONFIG.name} <noreply@${APP_CONFIG.domain}>`;

  return {
    host,
    port,
    secure,
    hasUser: Boolean(user),
    hasPass: Boolean(pass),
    passSource,
    from,
    nodeEnv: process.env.NODE_ENV,
    railwayService: runtimeEnv('RAILWAY_SERVICE_NAME'),
  };
}

function logSmtpConfig(snapshot: SmtpConfigSnapshot): void {
  console.log('[otp-email] effective SMTP config', snapshot);
}

function formatError(error: unknown): { message: string; stack?: string; code?: string } {
  if (error instanceof Error) {
    const smtpError = error as Error & { code?: string; response?: string; responseCode?: number };
    return {
      message: smtpError.message,
      stack: smtpError.stack,
      code: smtpError.code,
    };
  }
  return { message: String(error) };
}

async function resolveSmtpIpv4Host(hostname: string): Promise<ResolvedSmtpHost> {
  ensureIpv4FirstDns();
  const result = await dns.promises.lookup(hostname, { family: 4 });
  console.log('[otp-email] DNS resolved SMTP host', {
    hostname,
    address: result.address,
    family: result.family,
  });
  return {
    hostname,
    address: result.address,
    family: result.family,
  };
}

function createTransporter(snapshot: SmtpConfigSnapshot, resolved: ResolvedSmtpHost) {
  const user = runtimeEnv('SMTP_USER');
  const { pass } = getSmtpPassword();

  console.log('[otp-email] using IPv4 transport', {
    connectHost: resolved.address,
    servername: resolved.hostname,
    family: 4,
  });

  // Nodemailer 9 resolves IPv4+IPv6 and may pick IPv6 at random; connect to the
  // IPv4 literal and keep servername for STARTTLS/SNI.
  const options = {
    host: resolved.address,
    servername: resolved.hostname,
    port: snapshot.port,
    secure: snapshot.secure,
    family: 4,
    auth: user
      ? {
          user,
          pass,
        }
      : undefined,
  } as SMTPTransport.Options;

  return nodemailer.createTransport(options);
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  ensureIpv4FirstDns();

  const snapshot = getSmtpConfigSnapshot();
  logSmtpConfig(snapshot);

  const otpExpiryMinutes = getOtpExpiryMinutes();
  const subject = `${APP_CONFIG.name} verification code: ${code}`;
  const text = [
    `Your ${APP_CONFIG.name} verification code is: ${code}`,
    '',
    `This code expires in ${otpExpiryMinutes} minutes.`,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  if (!snapshot.host) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[otp-email] SMTP_HOST missing at runtime — check Railway env on web service');
      throw new Error('SMTP is not configured on the web service');
    }
    console.log(`[otp-email] SMTP not configured — dev code for ${email}: ${code}`);
    return;
  }

  if (!snapshot.hasPass && snapshot.hasUser) {
    console.error('[otp-email] SMTP_USER set but neither SMTP_PASS nor SMTP_PASSWORD is set');
  }

  const resolved = await resolveSmtpIpv4Host(snapshot.host);
  const transporter = createTransporter(snapshot, resolved);

  try {
    await transporter.verify();
    console.log('[otp-email] SMTP transporter.verify() succeeded', {
      hostname: resolved.hostname,
      connectHost: resolved.address,
      family: resolved.family,
      port: snapshot.port,
      secure: snapshot.secure,
    });
  } catch (error) {
    const details = formatError(error);
    console.error('[otp-email] SMTP transporter.verify() failed', {
      ...snapshot,
      connectHost: resolved.address,
      servername: resolved.hostname,
      family: resolved.family,
      error: details.message,
      code: details.code,
      stack: details.stack,
    });
    throw new Error(`SMTP connection failed: ${details.message}`);
  }

  try {
    const info = await transporter.sendMail({
      from: snapshot.from,
      to: email,
      subject,
      text,
    });

    console.log('[otp-email] sendMail() succeeded', {
      to: email,
      from: snapshot.from,
      connectHost: resolved.address,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (error) {
    const details = formatError(error);
    console.error('[otp-email] sendMail() failed', {
      ...snapshot,
      to: email,
      connectHost: resolved.address,
      servername: resolved.hostname,
      error: details.message,
      code: details.code,
      stack: details.stack,
    });
    throw error;
  }
}
